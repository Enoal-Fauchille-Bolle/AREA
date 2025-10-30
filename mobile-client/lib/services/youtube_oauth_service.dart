import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'runtime_config.dart';

class YoutubeOAuthService {
  static String get clientId => dotenv.env['YOUTUBE_CLIENT_ID'] ?? '';
  static const String scope =
      'https://www.googleapis.com/auth/youtube.readonly';

  static Future<String> _buildAuthUrl({required bool forService}) async {
    final baseUrl = await RuntimeConfig().getServerUrl();
    final redirectUri =
        forService ? '$baseUrl/service/callback' : '$baseUrl/auth/callback';

    final params = {
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      'scope': scope,
      'state': forService ? 'service-youtube' : 'youtube',
      'access_type': 'offline',
      'prompt': 'consent'
    };

    final uri = Uri.https('accounts.google.com', '/o/oauth2/v2/auth', params);
    return uri.toString();
  }

  static Future<String?> authorize(BuildContext context,
      {bool forService = false}) async {
    final authUrl = await _buildAuthUrl(forService: forService);
    return Navigator.of(context).push<String>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (context) => _OAuthWebView(
            authUrl: authUrl, forService: forService, providerName: 'YouTube'),
      ),
    );
  }
}

class _OAuthWebView extends StatefulWidget {
  final String authUrl;
  final bool forService;
  final String providerName;

  const _OAuthWebView(
      {required this.authUrl,
      required this.forService,
      required this.providerName});

  @override
  State<_OAuthWebView> createState() => _OAuthWebViewState();
}

class _OAuthWebViewState extends State<_OAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _isDisposed = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
          'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36')
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (url) {
          if (!_isDisposed) _checkForCode(url);
        },
        onPageFinished: (url) {
          if (!_isDisposed) setState(() => _isLoading = false);
        },
        onWebResourceError: (error) {
          if (error.description.contains('ERR_CLEARTEXT_NOT_PERMITTED')) return;
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text('Failed to load: ${error.description}'),
                  backgroundColor: Colors.orange),
            );
          }
        },
        onNavigationRequest: (request) => NavigationDecision.navigate,
      ))
      ..loadRequest(Uri.parse(widget.authUrl));
  }

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  void _checkForCode(String url) {
    if (_isDisposed) return;
    final uri = Uri.parse(url);

    if (uri.host == 'localhost') {
      final expectedPath =
          widget.forService ? '/service/callback' : '/auth/callback';
      if (uri.path == expectedPath) {
        if (uri.queryParameters.containsKey('code')) {
          final code = uri.queryParameters['code'];
          if (mounted && code != null && !_isDisposed) {
            _controller.loadRequest(Uri.parse('about:blank'));
            Navigator.of(context).pop(code);
          }
          return;
        }

        if (uri.queryParameters.containsKey('error')) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text(
                      'Authorization failed: ${uri.queryParameters['error_description'] ?? uri.queryParameters['error']}'),
                  backgroundColor: Colors.red),
            );
            Navigator.of(context).pop();
          }
          return;
        }
      }
    }

    if ((uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.queryParameters.containsKey('code')) {
      final expectedPath =
          widget.forService ? '/service/callback' : '/auth/callback';
      if (uri.path == expectedPath) {
        final code = uri.queryParameters['code'];
        if (mounted && code != null && !_isDisposed) {
          _controller.loadRequest(Uri.parse('about:blank'));
          Navigator.of(context).pop(code);
        }
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text('${widget.providerName} Authorization'),
          leading: IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => Navigator.of(context).pop())),
      body: Stack(children: [
        WebViewWidget(controller: _controller),
        if (_isLoading) const Center(child: CircularProgressIndicator())
      ]),
    );
  }
}
