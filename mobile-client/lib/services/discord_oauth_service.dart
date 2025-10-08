import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DiscordOAuthService {
  static const String clientId = '1424743637777907742';

  // Use the backend URL from environment variables
  static String get redirectUri {
    final baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
    final port = dotenv.env['PORT'] ?? '3000';
    return '$baseUrl:$port/auth/discord/callback';
  }

  static const String scope = 'identify email';

  /// Opens Discord OAuth in a WebView and returns the authorization code
  static Future<String?> authorize(BuildContext context) async {
    final authUrl = Uri.https('discord.com', '/oauth2/authorize', {
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      'scope': scope,
    }).toString();

    return Navigator.of(context).push<String>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (context) => _DiscordOAuthWebView(authUrl: authUrl),
      ),
    );
  }
}

class _DiscordOAuthWebView extends StatefulWidget {
  final String authUrl;

  const _DiscordOAuthWebView({required this.authUrl});

  @override
  State<_DiscordOAuthWebView> createState() => _DiscordOAuthWebViewState();
}

class _DiscordOAuthWebViewState extends State<_DiscordOAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            _checkForCode(url);
          },
          onPageFinished: (url) {
            setState(() => _isLoading = false);
          },
          onWebResourceError: (error) {},
        ),
      )
      ..loadRequest(Uri.parse(widget.authUrl));
  }

  void _checkForCode(String url) {
    final uri = Uri.parse(url);

    // Extract host and port from the redirect URI
    final redirectUriParsed = Uri.parse(DiscordOAuthService.redirectUri);

    // Check if this is the callback URL with a code
    if (uri.host == redirectUriParsed.host &&
        uri.port == redirectUriParsed.port &&
        uri.path == redirectUriParsed.path &&
        uri.queryParameters.containsKey('code')) {
      final code = uri.queryParameters['code'];

      if (mounted && code != null) {
        Navigator.of(context).pop(code);
      }
    }

    // Check for error
    if (uri.queryParameters.containsKey('error')) {
      final error = uri.queryParameters['error'];
      final errorDescription =
          uri.queryParameters['error_description'] ?? error;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Authorization failed: $errorDescription'),
            backgroundColor: Colors.red,
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discord Authorization'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
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
