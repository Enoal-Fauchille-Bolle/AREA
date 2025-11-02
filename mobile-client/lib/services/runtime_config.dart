import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../utils/app_logger.dart';

/// RuntimeConfig: Singleton service for managing application server configuration
/// Allows users to change the server URL/port at runtime without rebuilding the app
/// Falls back to .env values if no custom config is set
class RuntimeConfig {
  static final RuntimeConfig _instance = RuntimeConfig._internal();
  factory RuntimeConfig() => _instance;
  RuntimeConfig._internal();

  static const String _keyBaseUrl = 'server_base_url';
  static const String _keyPort = 'server_port';

  String? _cachedBaseUrl;
  String? _cachedPort;

  /// Get the base URL for the application server
  /// Priority: 1) User-configured value 2) .env value 3) Default fallback
  Future<String> getBaseUrl() async {
    if (_cachedBaseUrl != null) return _cachedBaseUrl!;

    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString(_keyBaseUrl);

    if (customUrl != null && customUrl.isNotEmpty) {
      _cachedBaseUrl = customUrl;
      AppLogger.log('RuntimeConfig: Using custom base URL: $customUrl');
      return customUrl;
    }

    // Fallback to .env
    final envUrl = dotenv.env['URL_BASE'] ?? 'http://localhost';
    _cachedBaseUrl = envUrl;
    AppLogger.log('RuntimeConfig: Using .env base URL: $envUrl');
    return envUrl;
  }

  /// Get the port for the application server
  /// Priority: 1) User-configured value 2) .env value 3) Default fallback
  Future<String> getPort() async {
    if (_cachedPort != null) return _cachedPort!;

    final prefs = await SharedPreferences.getInstance();
    final customPort = prefs.getString(_keyPort);

    if (customPort != null && customPort.isNotEmpty) {
      _cachedPort = customPort;
      AppLogger.log('RuntimeConfig: Using custom port: $customPort');
      return customPort;
    }

    // Fallback to .env
    final envPort = dotenv.env['PORT'] ?? '8080';
    _cachedPort = envPort;
    AppLogger.log('RuntimeConfig: Using .env port: $envPort');
    return envPort;
  }

  /// Get the full server URL (baseUrl:port)
  Future<String> getServerUrl() async {
    final baseUrl = await getBaseUrl();
    final port = await getPort();
    return '$baseUrl:$port';
  }

  /// Save custom base URL
  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyBaseUrl, url);
    _cachedBaseUrl = url;
    AppLogger.log('RuntimeConfig: Saved custom base URL: $url');
  }

  /// Save custom port
  Future<void> setPort(String port) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPort, port);
    _cachedPort = port;
    AppLogger.log('RuntimeConfig: Saved custom port: $port');
  }

  /// Clear custom configuration and revert to .env defaults
  Future<void> resetToDefaults() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyBaseUrl);
    await prefs.remove(_keyPort);
    _cachedBaseUrl = null;
    _cachedPort = null;
    AppLogger.log('RuntimeConfig: Reset to .env defaults');
  }

  /// Check if custom configuration is set
  Future<bool> hasCustomConfig() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_keyBaseUrl) || prefs.containsKey(_keyPort);
  }

  /// Get the default values from .env (for display in Settings)
  String getDefaultBaseUrl() => dotenv.env['URL_BASE'] ?? 'http://localhost';
  String getDefaultPort() => dotenv.env['PORT'] ?? '8080';

  /// Clear cache (useful after changing settings)
  void clearCache() {
    _cachedBaseUrl = null;
    _cachedPort = null;
  }
}
