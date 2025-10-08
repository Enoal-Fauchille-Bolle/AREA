import 'package:flutter/foundation.dart';

class AppLogger {
  /// Logs a message only in debug/profile mode. Suppressed in release builds.
  static void log(Object? message) {
    if (kReleaseMode) return;
    // ignore: avoid_print
    print(message);
  }

  static void error(Object? message) {
    if (kReleaseMode) return;
    // ignore: avoid_print
    print('[ERROR] $message');
  }
}
