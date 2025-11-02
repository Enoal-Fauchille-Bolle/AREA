import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/theme/app_theme.dart';

void main() {
  group('AppTheme Colors', () {
    test('should have correct brand colors', () {
      expect(AppTheme.primaryColor, equals(const Color(0xFF6366F1)));
      expect(AppTheme.secondaryColor, equals(const Color(0xFF8B5CF6)));
      expect(AppTheme.accentColor, equals(const Color(0xFF06B6D4)));
      expect(AppTheme.successColor, equals(const Color(0xFF10B981)));
      expect(AppTheme.errorColor, equals(const Color(0xFFEF4444)));
      expect(AppTheme.warningColor, equals(const Color(0xFFF59E0B)));
    });

    test('should have correct neutral colors', () {
      expect(AppTheme.backgroundColor, equals(const Color(0xFFF9FAFB)));
      expect(AppTheme.surfaceColor, equals(const Color(0xFFFFFFFF)));
      expect(AppTheme.textPrimary, equals(const Color(0xFF111827)));
      expect(AppTheme.textSecondary, equals(const Color(0xFF6B7280)));
      expect(AppTheme.dividerColor, equals(const Color(0xFFE5E7EB)));
    });

    test('should have correct dark theme colors', () {
      expect(AppTheme.darkBackgroundColor, equals(const Color(0xFF111827)));
      expect(AppTheme.darkSurfaceColor, equals(const Color(0xFF1F2937)));
      expect(AppTheme.darkTextPrimary, equals(const Color(0xFFF9FAFB)));
      expect(AppTheme.darkTextSecondary, equals(const Color(0xFF9CA3AF)));
      expect(AppTheme.darkDividerColor, equals(const Color(0xFF374151)));
    });
  });

  group('AppTheme Light Theme', () {
    late ThemeData lightTheme;

    setUp(() {
      lightTheme = AppTheme.lightTheme;
    });

    test('should use Material 3', () {
      expect(lightTheme.useMaterial3, isTrue);
    });

    test('should have light brightness', () {
      expect(lightTheme.brightness, equals(Brightness.light));
    });

    test('should have correct color scheme', () {
      expect(lightTheme.colorScheme.primary, equals(AppTheme.primaryColor));
      expect(lightTheme.colorScheme.secondary, equals(AppTheme.secondaryColor));
      expect(lightTheme.colorScheme.tertiary, equals(AppTheme.accentColor));
      expect(lightTheme.colorScheme.error, equals(AppTheme.errorColor));
      expect(lightTheme.colorScheme.surface, equals(AppTheme.surfaceColor));
    });

    test('should have correct scaffold background color', () {
      expect(
          lightTheme.scaffoldBackgroundColor, equals(AppTheme.backgroundColor));
    });

    test('should have configured AppBar theme', () {
      expect(lightTheme.appBarTheme.elevation, equals(0));
      expect(lightTheme.appBarTheme.centerTitle, isTrue);
      expect(lightTheme.appBarTheme.backgroundColor,
          equals(AppTheme.surfaceColor));
      expect(
          lightTheme.appBarTheme.foregroundColor, equals(AppTheme.textPrimary));
    });

    test('should have configured Card theme', () {
      expect(lightTheme.cardTheme.elevation, equals(0));
      expect(lightTheme.cardTheme.color, equals(AppTheme.surfaceColor));
      expect(lightTheme.cardTheme.shape, isA<RoundedRectangleBorder>());
    });

    test('should have configured ElevatedButton theme', () {
      final buttonStyle = lightTheme.elevatedButtonTheme.style;
      expect(buttonStyle?.backgroundColor?.resolve({}),
          equals(AppTheme.primaryColor));
      expect(buttonStyle?.foregroundColor?.resolve({}), equals(Colors.white));
      expect(buttonStyle?.elevation?.resolve({}), equals(0));
    });

    test('should have configured TextButton theme', () {
      final buttonStyle = lightTheme.textButtonTheme.style;
      expect(buttonStyle?.foregroundColor?.resolve({}),
          equals(AppTheme.primaryColor));
    });

    test('should have configured InputDecoration theme', () {
      expect(lightTheme.inputDecorationTheme.filled, isTrue);
      expect(lightTheme.inputDecorationTheme.fillColor,
          equals(AppTheme.surfaceColor));
    });

    test('should have configured FloatingActionButton theme', () {
      expect(lightTheme.floatingActionButtonTheme.backgroundColor,
          equals(AppTheme.primaryColor));
      expect(lightTheme.floatingActionButtonTheme.foregroundColor,
          equals(Colors.white));
      expect(lightTheme.floatingActionButtonTheme.elevation, equals(2));
    });

    test('should have configured text theme', () {
      expect(lightTheme.textTheme.displayLarge?.fontSize, equals(32));
      expect(lightTheme.textTheme.displayLarge?.fontWeight,
          equals(FontWeight.w700));
      expect(lightTheme.textTheme.bodyLarge?.fontSize, equals(16));
      expect(lightTheme.textTheme.bodyMedium?.fontSize, equals(14));
    });

    test('should have configured icon theme', () {
      expect(lightTheme.iconTheme.color, equals(AppTheme.textPrimary));
      expect(lightTheme.iconTheme.size, equals(24));
    });

    test('should have configured divider theme', () {
      expect(lightTheme.dividerTheme.color, equals(AppTheme.dividerColor));
      expect(lightTheme.dividerTheme.thickness, equals(1));
    });
  });

  group('AppTheme Dark Theme', () {
    late ThemeData darkTheme;

    setUp(() {
      darkTheme = AppTheme.darkTheme;
    });

    test('should use Material 3', () {
      expect(darkTheme.useMaterial3, isTrue);
    });

    test('should have dark brightness', () {
      expect(darkTheme.brightness, equals(Brightness.dark));
    });

    test('should have correct color scheme', () {
      expect(darkTheme.colorScheme.primary, equals(AppTheme.primaryColor));
      expect(darkTheme.colorScheme.secondary, equals(AppTheme.secondaryColor));
      expect(darkTheme.colorScheme.tertiary, equals(AppTheme.accentColor));
      expect(darkTheme.colorScheme.error, equals(AppTheme.errorColor));
      expect(darkTheme.colorScheme.surface, equals(AppTheme.darkSurfaceColor));
    });

    test('should have correct scaffold background color', () {
      expect(darkTheme.scaffoldBackgroundColor,
          equals(AppTheme.darkBackgroundColor));
    });

    test('should have configured AppBar theme', () {
      expect(darkTheme.appBarTheme.elevation, equals(0));
      expect(darkTheme.appBarTheme.centerTitle, isTrue);
      expect(darkTheme.appBarTheme.backgroundColor,
          equals(AppTheme.darkSurfaceColor));
      expect(darkTheme.appBarTheme.foregroundColor,
          equals(AppTheme.darkTextPrimary));
    });

    test('should have configured Card theme', () {
      expect(darkTheme.cardTheme.elevation, equals(0));
      expect(darkTheme.cardTheme.color, equals(AppTheme.darkSurfaceColor));
    });

    test('should have configured text theme with dark colors', () {
      expect(darkTheme.textTheme.displayLarge?.color,
          equals(AppTheme.darkTextPrimary));
      expect(darkTheme.textTheme.bodyLarge?.color,
          equals(AppTheme.darkTextPrimary));
      expect(darkTheme.textTheme.bodySmall?.color,
          equals(AppTheme.darkTextSecondary));
    });

    test('should have configured icon theme with dark colors', () {
      expect(darkTheme.iconTheme.color, equals(AppTheme.darkTextPrimary));
    });
  });

  group('AppTheme Helper Methods', () {
    test('getStatusColor should return success color for active', () {
      final color = AppTheme.getStatusColor(true);
      expect(color, equals(AppTheme.successColor));
    });

    test('getStatusColor should return textSecondary for inactive', () {
      final color = AppTheme.getStatusColor(false);
      expect(color, equals(AppTheme.textSecondary));
    });

    test('should have service colors map', () {
      expect(
          AppTheme.serviceColors['discord'], equals(const Color(0xFF5865F2)));
      expect(AppTheme.serviceColors['github'], equals(const Color(0xFF24292F)));
      expect(AppTheme.serviceColors['clock'], equals(const Color(0xFF06B6D4)));
      expect(AppTheme.serviceColors['email'], equals(const Color(0xFFEF4444)));
    });

    test('getServiceColor should return correct color for known service', () {
      expect(
          AppTheme.getServiceColor('discord'), equals(const Color(0xFF5865F2)));
      expect(
          AppTheme.getServiceColor('github'), equals(const Color(0xFF24292F)));
      expect(
          AppTheme.getServiceColor('clock'), equals(const Color(0xFF06B6D4)));
      expect(
          AppTheme.getServiceColor('email'), equals(const Color(0xFFEF4444)));
    });

    test('getServiceColor should handle case insensitive service names', () {
      expect(
          AppTheme.getServiceColor('Discord'), equals(const Color(0xFF5865F2)));
      expect(
          AppTheme.getServiceColor('GITHUB'), equals(const Color(0xFF24292F)));
      expect(
          AppTheme.getServiceColor('Clock'), equals(const Color(0xFF06B6D4)));
    });

    test('getServiceColor should return primary color for unknown service', () {
      expect(
          AppTheme.getServiceColor('unknown'), equals(AppTheme.primaryColor));
      expect(AppTheme.getServiceColor('random_service'),
          equals(AppTheme.primaryColor));
    });
  });

  group('AppTheme Widget Integration', () {
    testWidgets('light theme should be applied to MaterialApp',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(
            body: Text('Test'),
          ),
        ),
      );

      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.theme?.brightness, equals(Brightness.light));
      expect(materialApp.theme?.colorScheme.primary,
          equals(AppTheme.primaryColor));
    });

    testWidgets('dark theme should be applied to MaterialApp',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const Scaffold(
            body: Text('Test'),
          ),
        ),
      );

      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.theme?.brightness, equals(Brightness.dark));
      expect(materialApp.theme?.scaffoldBackgroundColor,
          equals(AppTheme.darkBackgroundColor));
    });

    testWidgets('theme should style ElevatedButton correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {},
              child: const Text('Button'),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('theme should style TextButton correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: TextButton(
              onPressed: () {},
              child: const Text('Button'),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byType(TextButton), findsOneWidget);
    });

    testWidgets('theme should style TextField correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(
            body: TextField(
              decoration: InputDecoration(labelText: 'Test'),
            ),
          ),
        ),
      );

      expect(find.byType(TextField), findsOneWidget);
    });
  });
}
