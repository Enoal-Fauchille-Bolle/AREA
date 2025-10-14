import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DiscordOAuthService {
  static String get clientId =>
      dotenv.env['DISCORD_CLIENT_ID'] ?? '1424743637777907742';

  // Use the backend URL from environment variables
  static String get redirectUri {
    // Allow explicit override via DISCORD_REDIRECT_URI, otherwise construct from URL_BASE and PORT
    final explicit = dotenv.env['DISCORD_REDIRECT_URI'];
    if (explicit != null && explicit.isNotEmpty) return explicit;

    final baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
    final port = dotenv.env['PORT'] ?? '8080';
    return '$baseUrl:$port/auth/discord/callback';
  }

  static const String scope = 'identify email';

  /// Opens Discord OAuth in a WebView and returns the authorization code
  static Future<String?> authorize(BuildContext context) async {
    try {
      final authUrl = Uri.https('discord.com', '/oauth2/authorize', {
        'client_id': clientId,
        'response_type': 'code',
        'redirect_uri': redirectUri,
        'scope': scope,
      });

      return await Navigator.of(context).push<String>(
        MaterialPageRoute(
          fullscreenDialog: true,
          builder: (context) =>
              _DiscordOAuthWebView(authUrl: authUrl.toString()),
        ),
      );
    } catch (e) {
      debugPrint('Discord OAuth error: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start Discord authorization: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 20),
          ),
        );
      }
      return null;
    }
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
          onWebResourceError: (error) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to load: ${error.description}'),
                  backgroundColor: Colors.orange,
                  duration: const Duration(seconds: 20),
                ),
              );
            }
          },
          onNavigationRequest: (request) {
            // Allow all navigation requests
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authUrl));
  }

  void _checkForCode(String url) {
    final uri = Uri.parse(url);

    // Extract scheme, host, and path from the redirect URI
    final redirectUriParsed = Uri.parse(DiscordOAuthService.redirectUri);

    // Check if this is the callback URL with a code
    // For custom schemes like area://, the host might be in the path
    final isCallbackUrl = (uri.scheme == redirectUriParsed.scheme) &&
        (uri.host == redirectUriParsed.host ||
            uri
                .toString()
                .startsWith(redirectUriParsed.toString().split('?')[0]));

    if (isCallbackUrl && uri.queryParameters.containsKey('code')) {
      final code = uri.queryParameters['code'];

      if (mounted && code != null && code.isNotEmpty) {
        Navigator.of(context).pop(code);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid authorization code received'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 20),
          ),
        );
        Navigator.of(context).pop();
      }
    }

    // Check for OAuth error response (e.g., access_denied, invalid_request)
    if (uri.queryParameters.containsKey('error')) {
      final error = uri.queryParameters['error'];
      final errorDescription =
          uri.queryParameters['error_description'] ?? error ?? 'Unknown error';

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Authorization failed: $errorDescription'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 20),
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
