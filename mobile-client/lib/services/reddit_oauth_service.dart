import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../utils/app_logger.dart';

class RedditOAuthService {
  static const String _authUrl = 'https://www.reddit.com/api/v1/authorize';
  static final String _clientId = dotenv.env['REDDIT_CLIENT_ID'] ?? '';
  static final String _redirectUri = dotenv.env['OAUTH_REDIRECT_URI'] ?? '';

  static Future<String?> authorize(
    BuildContext context, {
    bool forService = false,
  }) async {
    if (_clientId.isEmpty) {
      AppLogger.error('Reddit Client ID not configured');
      return null;
    }

    final state = forService ? 'service-reddit' : 'reddit';
    final scopes = [
      'identity',
      'read',
      'submit',
      'subscribe',
    ].join(' ');

    final authorizationUrl =
        '$_authUrl?client_id=$_clientId&response_type=code&redirect_uri=${Uri.encodeComponent(_redirectUri)}&state=$state&scope=${Uri.encodeComponent(scopes)}&duration=permanent';

    AppLogger.log('Opening Reddit OAuth: $authorizationUrl');

    if (!context.mounted) return null;

    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => _RedditOAuthWebView(
          authUrl: authorizationUrl,
          redirectUri: _redirectUri,
        ),
      ),
    );

    return code;
  }
}

class _RedditOAuthWebView extends StatefulWidget {
  final String authUrl;
  final String redirectUri;

  const _RedditOAuthWebView({
    required this.authUrl,
    required this.redirectUri,
  });

  @override
  State<_RedditOAuthWebView> createState() => _RedditOAuthWebViewState();
}

class _RedditOAuthWebViewState extends State<_RedditOAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            AppLogger.log('Reddit OAuth page started: $url');
            _checkForRedirect(url);
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            AppLogger.log('Reddit OAuth page finished: $url');
          },
          onWebResourceError: (WebResourceError error) {
            AppLogger.error('Reddit OAuth error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authUrl));
  }

  void _checkForRedirect(String url) {
    if (url.startsWith(widget.redirectUri)) {
      final uri = Uri.parse(url);
      final code = uri.queryParameters['code'];
      final error = uri.queryParameters['error'];

      if (error != null) {
        AppLogger.error('Reddit OAuth error: $error');
        if (mounted) {
          Navigator.pop(context);
        }
        return;
      }

      if (code != null) {
        AppLogger.log('Reddit OAuth code received: $code');
        if (mounted) {
          Navigator.pop(context, code);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Reddit'),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
