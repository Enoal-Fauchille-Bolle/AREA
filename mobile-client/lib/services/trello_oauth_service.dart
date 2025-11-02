import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/app_logger.dart';
import 'auth_service.dart';
import 'runtime_config.dart';

class TrelloOAuthService {
  static final _config = RuntimeConfig();
  static final _authService = AuthService();

  /// Get Trello auth URL from backend
  /// Backend will provide the OAuth 1.0 authorization URL
  static Future<String> getAuthUrl() async {
    try {
      final serverUrl = await _config.getServerUrl();
      final token = await _authService.getToken();

      final response = await http.get(
        Uri.parse('$serverUrl/services/trello/auth-url'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final authUrl = data['authUrl'] as String;

        // Backend already provides the correct return URL (http://localhost:8080/services/trello/callback)
        // Mobile WebView can intercept localhost URLs, so we don't need to modify it
        AppLogger.log('Using Trello auth URL from backend: $authUrl');

        return authUrl;
      } else {
        throw Exception(
            'Failed to get Trello auth URL: ${response.statusCode}');
      }
    } catch (e) {
      AppLogger.error('Error getting Trello auth URL: $e');
      rethrow;
    }
  }

  /// Link Trello account with the provided OAuth token
  static Future<bool> linkTrello(String token) async {
    try {
      final serverUrl = await _config.getServerUrl();
      final jwtToken = await _authService.getToken();

      final response = await http.post(
        Uri.parse('$serverUrl/services/trello/link'),
        headers: {
          'Authorization': 'Bearer $jwtToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': token,
        }),
      );

      if (response.statusCode == 204) {
        return true;
      } else {
        AppLogger.error(
            'Failed to link Trello: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      AppLogger.error('Error linking Trello: $e');
      return false;
    }
  }

  /// Opens Trello OAuth 1.0 flow in a WebView and returns the authorization token
  /// Trello uses OAuth 1.0a, so the flow is different from OAuth 2.0
  static Future<String?> authorize(BuildContext context) async {
    try {
      // Get the auth URL from backend
      final authUrl = await getAuthUrl();

      if (!context.mounted) return null;

      return Navigator.of(context).push<String>(
        MaterialPageRoute(
          fullscreenDialog: true,
          builder: (context) => _TrelloOAuthWebView(authUrl: authUrl),
        ),
      );
    } catch (e) {
      AppLogger.error('Error in Trello authorize: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to initialize Trello OAuth: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return null;
    }
  }

  /// Get Trello profile information
  static Future<Map<String, dynamic>?> getProfile() async {
    try {
      final serverUrl = await _config.getServerUrl();
      final token = await _authService.getToken();

      final response = await http.get(
        Uri.parse('$serverUrl/services/trello/profile'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        AppLogger.error('Failed to get Trello profile: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      AppLogger.error('Error getting Trello profile: $e');
      return null;
    }
  }
}

class _TrelloOAuthWebView extends StatefulWidget {
  final String authUrl;

  const _TrelloOAuthWebView({required this.authUrl});

  @override
  State<_TrelloOAuthWebView> createState() => _TrelloOAuthWebViewState();
}

class _TrelloOAuthWebViewState extends State<_TrelloOAuthWebView> {
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
              _checkForToken(url);
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

  void _checkForToken(String url) {
    if (_isDisposed) return;

    final uri = Uri.parse(url);

    AppLogger.log('Trello OAuth navigation: $url');

    // IMPORTANT: Only capture token from the actual Trello callback URL
    // NOT from Atlassian login URLs!
    // The correct callback is: http://localhost:8080/services/trello/callback#token=xxxxx

    // Pattern 1: Check for localhost callback URL ONLY (most specific check)
    if ((uri.host == 'localhost' || uri.host == '127.0.0.1') &&
        uri.port == 8080 &&
        uri.path == '/services/trello/callback') {
      AppLogger.log('✓ On correct Trello callback URL: ${uri.toString()}');

      // Check fragment for token
      if (uri.fragment.isNotEmpty) {
        AppLogger.log('Found fragment: ${uri.fragment}');

        // Parse fragment as query parameters
        final fragmentParams = Uri.splitQueryString(uri.fragment);
        if (fragmentParams.containsKey('token')) {
          final token = fragmentParams['token'];
          if (mounted && token != null && !_isDisposed) {
            AppLogger.log(
                '✓ Trello OAuth token received: ${token.substring(0, 10)}...');
            _controller.loadRequest(Uri.parse('about:blank'));
            Navigator.of(context).pop(token);
          }
          return;
        }

        // Try regex match on fragment (token=XXXXX)
        final match = RegExp(r'token=([^&]+)').firstMatch(uri.fragment);
        if (match != null) {
          final token = match.group(1);
          if (mounted && token != null && !_isDisposed) {
            AppLogger.log(
                '✓ Trello OAuth token extracted via regex: ${token.substring(0, 10)}...');
            _controller.loadRequest(Uri.parse('about:blank'));
            Navigator.of(context).pop(token);
          }
          return;
        }

        // Sometimes entire fragment is the token (if it's long and not an error)
        if (uri.fragment.length > 32 &&
            !uri.fragment.contains('error') &&
            !uri.fragment.contains('=')) {
          final token = uri.fragment;
          if (mounted && !_isDisposed) {
            AppLogger.log(
                '✓ Using entire fragment as Trello token: ${token.substring(0, 10)}...');
            _controller.loadRequest(Uri.parse('about:blank'));
            Navigator.of(context).pop(token);
          }
          return;
        }
      }

      // Check query parameters as fallback (less common but possible)
      if (uri.queryParameters.containsKey('token')) {
        final token = uri.queryParameters['token'];
        if (mounted && token != null && !_isDisposed) {
          AppLogger.log(
              '✓ Trello OAuth token received via query: ${token.substring(0, 10)}...');
          _controller.loadRequest(Uri.parse('about:blank'));
          Navigator.of(context).pop(token);
        }
        return;
      }

      // On callback URL but no token yet - log and wait
      AppLogger.log('On callback URL but no token found yet, waiting...');
      return;
    }

    // Pattern 2: Error handling (only on callback URL)
    if ((uri.host == 'localhost' || uri.host == '127.0.0.1') &&
        uri.path == '/services/trello/callback') {
      if (uri.queryParameters.containsKey('error') ||
          uri.fragment.contains('error')) {
        final error = uri.queryParameters['error'] ?? 'Authorization failed';
        final errorDescription =
            uri.queryParameters['error_description'] ?? error;
        if (mounted && !_isDisposed) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Trello authorization failed: $errorDescription'),
              backgroundColor: Colors.red,
            ),
          );
          Navigator.of(context).pop();
        }
        return;
      }
    }

    // All other URLs (Atlassian login, etc.) - just log and continue
    AppLogger.log('Navigating through OAuth flow... (not callback URL yet)');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trello Authorization'),
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
