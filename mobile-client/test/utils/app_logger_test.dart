import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/utils/app_logger.dart';

void main() {
  group('AppLogger', () {
    test('log should print message in debug mode', () {
      // In test mode, we're not in release mode
      expect(kReleaseMode, isFalse);

      // This should not throw an error
      AppLogger.log('Test log message');
      AppLogger.log(123);
      AppLogger.log({'key': 'value'});
      AppLogger.log(null);
    });

    test('error should print error message in debug mode', () {
      // In test mode, we're not in release mode
      expect(kReleaseMode, isFalse);

      // This should not throw an error
      AppLogger.error('Test error message');
      AppLogger.error(Exception('Test exception'));
      AppLogger.error({'error': 'details'});
      AppLogger.error(null);
    });

    test('log should handle various object types', () {
      // Test with different types
      AppLogger.log('String');
      AppLogger.log(42);
      AppLogger.log(3.14);
      AppLogger.log(true);
      AppLogger.log(['list', 'items']);
      AppLogger.log({'map': 'value'});
    });

    test('error should handle various object types', () {
      // Test with different types
      AppLogger.error('Error string');
      AppLogger.error(404);
      AppLogger.error(Exception('Exception object'));
      AppLogger.error(['error', 'list']);
      AppLogger.error({'error': 'map'});
    });
  });
}
