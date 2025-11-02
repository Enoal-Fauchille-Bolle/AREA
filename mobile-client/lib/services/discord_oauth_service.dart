import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'runtime_config.dart';

class DiscordOAuthService {
  static final _config = RuntimeConfig();
  static String get clientId =>
      dotenv.env['DISCORD_CLIENT_ID'] ?? '1424743637777907742';

  // Get redirect URI based on the flow type (auth or service)
  static Future<String> getRedirectUri({bool forService = false}) async {
    final baseUrl = await _config.getServerUrl();

    if (forService) {
      // For service linking (AREA connections)
      return '$baseUrl/service/callback';
    } else {
      // For user authentication (login/signup)
      return '$baseUrl/auth/callback';
    }
  }

  static const String scope = 'identify email';

  /// Opens Discord OAuth in a WebView and returns the authorization code
  /// [forService] - true for service linking, false for user authentication
  static Future<String?> authorize(BuildContext context,
      {bool forService = false}) async {
    final redirectUri = await getRedirectUri(forService: forService);
    final state = forService ? 'service-discord' : 'discord';

    final authUrl = Uri.https('discord.com', '/oauth2/authorize', {
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      'scope': scope,
      'state': state,
    }).toString();

    if (!context.mounted) return null;
    return Navigator.of(context).push<String>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (context) => _DiscordOAuthWebView(
          authUrl: authUrl,
          forService: forService,
        ),
      ),
    );
  }
}

class _DiscordOAuthWebView extends StatefulWidget {
  final String authUrl;
  final bool forService;

  const _DiscordOAuthWebView({
    required this.authUrl,
    required this.forService,
  });

  @override
  State<_DiscordOAuthWebView> createState() => _DiscordOAuthWebViewState();
}

class _DiscordOAuthWebViewState extends State<_DiscordOAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _isDisposed = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            if (!_isDisposed) {
              _checkForCode(url);
            }
          },
          onPageFinished: (url) {
            if (!_isDisposed) {
              setState(() => _isLoading = false);
            }
          },
          onWebResourceError: (error) {
            // Ignore cleartext errors silently (expected for local development)
            if (error.description.contains('ERR_CLEARTEXT_NOT_PERMITTED')) {
              return;
            }
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

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  void _checkForCode(String url) {
    if (_isDisposed) return;

    final uri = Uri.parse(url);

    // Extract redirect URI based on flow type
    // Note: This needs to be handled carefully since getRedirectUri is now async
    // We'll check the path pattern directly
    final expectedPath =
        widget.forService ? '/service/callback' : '/auth/callback';

    // Check for mobile callback (http://localhost:8080/service/callback?code=... or /auth/callback)
    if (uri.host == 'localhost' && uri.port == 8080) {
      if (uri.path == expectedPath) {
        if (uri.queryParameters.containsKey('code')) {
          final code = uri.queryParameters['code'];
          if (mounted && code != null && !_isDisposed) {
            // Stop loading to prevent crash
            _controller.loadRequest(Uri.parse('about:blank'));
            Navigator.of(context).pop(code);
          }
          return;
        }

        if (uri.queryParameters.containsKey('error')) {
          final error = uri.queryParameters['error'];
          final errorDescription =
              uri.queryParameters['error_description'] ?? error;
          if (mounted && !_isDisposed) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Authorization failed: $errorDescription'),
                backgroundColor: Colors.red,
              ),
            );
            Navigator.of(context).pop();
          }
          return;
        }
      }
    }

    // Check for backend HTTP callback (http://backend:8080/auth/discord/callback?code=...)
    if (uri.scheme == 'http' || uri.scheme == 'https') {
      // Check if this is the backend callback URL by checking the path
      if (uri.path == expectedPath && uri.queryParameters.containsKey('code')) {
        final code = uri.queryParameters['code'];

        if (mounted && code != null && !_isDisposed) {
          // Stop loading to prevent crash
          _controller.loadRequest(Uri.parse('about:blank'));
          Navigator.of(context).pop(code);
        }
        return;
      }

      // Check for error in HTTP callback
      if (uri.queryParameters.containsKey('error')) {
        final error = uri.queryParameters['error'];
        final errorDescription =
            uri.queryParameters['error_description'] ?? error;

        if (mounted && !_isDisposed) {
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
