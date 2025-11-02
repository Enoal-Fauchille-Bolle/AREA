import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_client/services/runtime_config.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('RuntimeConfig', () {
    setUp(() async {
      // Mock SharedPreferences
      SharedPreferences.setMockInitialValues({});

      // Mock .env values
      dotenv.testLoad(fileInput: '''
URL_BASE=http://test-env-url
PORT=3000
''');
    });

    tearDown(() async {
      final config = RuntimeConfig();
      await config.resetToDefaults();
      config.clearCache();
    });

    test('should return default URL from .env when no custom config is set',
        () async {
      final config = RuntimeConfig();
      final baseUrl = await config.getBaseUrl();
      expect(baseUrl, equals('http://test-env-url'));
    });

    test('should return default port from .env when no custom config is set',
        () async {
      final config = RuntimeConfig();
      final port = await config.getPort();
      expect(port, equals('3000'));
    });

    test('should return full server URL combining base URL and port', () async {
      final config = RuntimeConfig();
      final serverUrl = await config.getServerUrl();
      expect(serverUrl, equals('http://test-env-url:3000'));
    });

    test('should save and retrieve custom base URL', () async {
      final config = RuntimeConfig();
      await config.setBaseUrl('http://custom-url');

      final baseUrl = await config.getBaseUrl();
      expect(baseUrl, equals('http://custom-url'));
    });

    test('should save and retrieve custom port', () async {
      final config = RuntimeConfig();
      await config.setPort('9000');

      final port = await config.getPort();
      expect(port, equals('9000'));
    });

    test('should return custom server URL when custom config is set', () async {
      final config = RuntimeConfig();
      await config.setBaseUrl('http://custom-url');
      await config.setPort('9000');

      final serverUrl = await config.getServerUrl();
      expect(serverUrl, equals('http://custom-url:9000'));
    });

    test('should reset to .env defaults', () async {
      final config = RuntimeConfig();

      // Set custom values
      await config.setBaseUrl('http://custom-url');
      await config.setPort('9000');

      // Reset
      await config.resetToDefaults();

      final baseUrl = await config.getBaseUrl();
      final port = await config.getPort();

      expect(baseUrl, equals('http://test-env-url'));
      expect(port, equals('3000'));
    });

    test('should detect when custom config is set', () async {
      final config = RuntimeConfig();

      bool hasCustom = await config.hasCustomConfig();
      expect(hasCustom, isFalse);

      await config.setBaseUrl('http://custom-url');

      hasCustom = await config.hasCustomConfig();
      expect(hasCustom, isTrue);
    });

    test('should get default base URL from .env', () {
      final config = RuntimeConfig();
      final defaultUrl = config.getDefaultBaseUrl();
      expect(defaultUrl, equals('http://test-env-url'));
    });

    test('should get default port from .env', () {
      final config = RuntimeConfig();
      final defaultPort = config.getDefaultPort();
      expect(defaultPort, equals('3000'));
    });

    test('should use cache for subsequent calls', () async {
      final config = RuntimeConfig();

      // First call
      final baseUrl1 = await config.getBaseUrl();
      // Second call should use cache
      final baseUrl2 = await config.getBaseUrl();

      expect(baseUrl1, equals(baseUrl2));
    });

    test('should clear cache', () async {
      final config = RuntimeConfig();

      await config.getBaseUrl();
      config.clearCache();

      // After clearing cache, should re-fetch from SharedPreferences
      final baseUrl = await config.getBaseUrl();
      expect(baseUrl, equals('http://test-env-url'));
    });

    test('should handle empty custom URL', () async {
      final config = RuntimeConfig();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('server_base_url', '');

      config.clearCache();
      final baseUrl = await config.getBaseUrl();

      // Should fallback to .env when custom URL is empty
      expect(baseUrl, equals('http://test-env-url'));
    });

    test('should handle empty custom port', () async {
      final config = RuntimeConfig();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('server_port', '');

      config.clearCache();
      final port = await config.getPort();

      // Should fallback to .env when custom port is empty
      expect(port, equals('3000'));
    });

    test('should handle missing .env values with defaults', () async {
      dotenv.testLoad(fileInput: '');

      final config = RuntimeConfig();
      config.clearCache();

      final baseUrl = await config.getBaseUrl();
      final port = await config.getPort();

      expect(baseUrl, equals('http://localhost'));
      expect(port, equals('8080'));
    });

    test('should be singleton instance', () {
      final config1 = RuntimeConfig();
      final config2 = RuntimeConfig();

      expect(identical(config1, config2), isTrue);
    });

    test('should persist custom config across instances', () async {
      final config1 = RuntimeConfig();
      await config1.setBaseUrl('http://persistent-url');

      final config2 = RuntimeConfig();
      final baseUrl = await config2.getBaseUrl();

      expect(baseUrl, equals('http://persistent-url'));
    });
  });
}
