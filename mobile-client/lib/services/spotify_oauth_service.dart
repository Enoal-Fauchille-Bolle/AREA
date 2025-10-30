import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../utils/app_logger.dart';
import 'runtime_config.dart';

class SpotifyOAuthService {
  static const String _authUrl = 'https://accounts.spotify.com/authorize';
  static final String _clientId = dotenv.env['SPOTIFY_CLIENT_ID'] ?? '';

  // Get redirect URI based on the flow type (auth or service)
  static Future<String> getRedirectUri({bool forService = false}) async {
    final config = RuntimeConfig();
    final baseUrl = await config.getServerUrl();
    // Replace localhost with 127.0.0.1 for Spotify
    final spotifyBaseUrl = baseUrl.replaceAll('localhost', '127.0.0.1');

    if (forService) {
      return '$spotifyBaseUrl/service/callback';
    } else {
      return '$spotifyBaseUrl/auth/callback';
    }
  }

  static Future<String?> authorize(
    BuildContext context, {
    bool forService = false,
  }) async {
    if (_clientId.isEmpty) {
      AppLogger.error('Spotify Client ID not configured');
      return null;
    }

    final redirectUri = await getRedirectUri(forService: forService);
    final state = forService ? 'service-spotify' : 'spotify';
    final scopes = [
      'user-read-email',
      'user-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-modify-playback-state',
      'user-read-playback-state',
    ].join(' ');

    final authorizationUrl =
        '$_authUrl?client_id=$_clientId&response_type=code&redirect_uri=${Uri.encodeComponent(redirectUri)}&state=$state&scope=${Uri.encodeComponent(scopes)}';

    AppLogger.log('Opening Spotify OAuth: $authorizationUrl');

    if (!context.mounted) return null;

    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => _SpotifyOAuthWebView(
          authUrl: authorizationUrl,
          forService: forService,
        ),
      ),
    );

    return code;
  }
}

class _SpotifyOAuthWebView extends StatefulWidget {
  final String authUrl;
  final bool forService;

  const _SpotifyOAuthWebView({
    required this.authUrl,
    required this.forService,
  });

  @override
  State<_SpotifyOAuthWebView> createState() => _SpotifyOAuthWebViewState();
}

class _SpotifyOAuthWebViewState extends State<_SpotifyOAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _redirectUri;

  @override
  void initState() {
    super.initState();
    _initRedirectUri();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            AppLogger.log('Spotify OAuth page started: $url');
            _checkForRedirect(url);
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            AppLogger.log('Spotify OAuth page finished: $url');
          },
          onWebResourceError: (WebResourceError error) {
            AppLogger.error('Spotify OAuth error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authUrl));
  }

  Future<void> _initRedirectUri() async {
    _redirectUri =
        await SpotifyOAuthService.getRedirectUri(forService: widget.forService);
  }

  void _checkForRedirect(String url) {
    if (_redirectUri == null) return;

    // Check both localhost and 127.0.0.1 versions
    final localRedirect = _redirectUri!.replaceAll('127.0.0.1', 'localhost');
    if (url.startsWith(_redirectUri!) || url.startsWith(localRedirect)) {
      final uri = Uri.parse(url);
      final code = uri.queryParameters['code'];
      final error = uri.queryParameters['error'];

      if (error != null) {
        AppLogger.error('Spotify OAuth error: $error');
        if (mounted) {
          Navigator.pop(context);
        }
        return;
      }

      if (code != null) {
        AppLogger.log('Spotify OAuth code received: $code');
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
        title: const Text('Connect Spotify'),
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
