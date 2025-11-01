import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_client/pages/settings_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    dotenv.testLoad(fileInput: '''
URL_BASE=http://localhost
PORT=8080
''');
  });

  group('SettingsPage UI Elements', () {
    testWidgets('should display app bar with title',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'Server Settings'), findsOneWidget);
    });

    testWidgets('should display info card', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.info_outline), findsOneWidget);
      expect(
          find.text(
              'Configure the network location of your AREA application server. Changes take effect immediately.'),
          findsOneWidget);
    });

    testWidgets('should display Base URL field', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Base URL'), findsOneWidget);
      expect(find.byIcon(Icons.link), findsOneWidget);
    });

    testWidgets('should display Port field', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Port'), findsOneWidget);
      expect(find.byIcon(Icons.settings_ethernet), findsOneWidget);
    });

    testWidgets('should display Save Configuration button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.widgetWithText(ElevatedButton, 'Save Configuration'),
          findsOneWidget);
    });

    testWidgets('should display Network Requirements section',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Network Requirements'), findsOneWidget);
    });

    testWidgets('should display Same Network info',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Same Network'), findsOneWidget);
      expect(find.byIcon(Icons.wifi), findsOneWidget);
    });

    testWidgets('should display Firewall info', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Firewall'), findsOneWidget);
      expect(find.byIcon(Icons.vpn_lock), findsOneWidget);
    });

    testWidgets('should display Android Security info',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Android Security'), findsOneWidget);
      expect(find.byIcon(Icons.security), findsOneWidget);
    });

    testWidgets('should show loading indicator initially',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should load current configuration',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      // Should display the form after loading
      expect(find.byType(Form), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
    });
  });

  group('SettingsPage Validation', () {
    testWidgets('should show error for empty base URL',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(find.byWidget(textFields[0]), '');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(find.text('Base URL is required'), findsOneWidget);
    });

    testWidgets('should show error for invalid URL format',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(find.byWidget(textFields[0]), 'invalid-url');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(
          find.text('Invalid URL format (must start with http:// or https://)'),
          findsOneWidget);
    });

    testWidgets('should accept valid http URL', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(
          find.byWidget(textFields[0]), 'http://192.168.1.100');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(
          find.text('Invalid URL format (must start with http:// or https://)'),
          findsNothing);
    });

    testWidgets('should accept valid https URL', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(
          find.byWidget(textFields[0]), 'https://example.com');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(
          find.text('Invalid URL format (must start with http:// or https://)'),
          findsNothing);
    });

    testWidgets('should show error for empty port',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(find.byWidget(textFields[0]), 'http://localhost');
      await tester.enterText(find.byWidget(textFields[1]), '');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(find.text('Port is required'), findsOneWidget);
    });

    testWidgets('should show error for invalid port (too low)',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(find.byWidget(textFields[0]), 'http://localhost');
      await tester.enterText(find.byWidget(textFields[1]), '0');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(find.text('Port must be between 1 and 65535'), findsOneWidget);
    });

    testWidgets('should show error for invalid port (too high)',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(find.byWidget(textFields[0]), 'http://localhost');
      await tester.enterText(find.byWidget(textFields[1]), '99999');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(find.text('Port must be between 1 and 65535'), findsOneWidget);
    });

    testWidgets('should show error for non-numeric port',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(find.byWidget(textFields[0]), 'http://localhost');
      await tester.enterText(find.byWidget(textFields[1]), 'abc');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(find.text('Port must be between 1 and 65535'), findsOneWidget);
    });

    testWidgets('should accept valid port', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      final textFields = tester
          .widgetList<TextFormField>(
            find.byType(TextFormField),
          )
          .toList();

      await tester.enterText(find.byWidget(textFields[0]), 'http://localhost');
      await tester.enterText(find.byWidget(textFields[1]), '8080');
      await tester
          .tap(find.widgetWithText(ElevatedButton, 'Save Configuration'));
      await tester.pump();

      expect(find.text('Port must be between 1 and 65535'), findsNothing);
    });
  });

  group('SettingsPage Interactions', () {
    testWidgets('should be scrollable', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });

    testWidgets('should have form key', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Form), findsOneWidget);
    });

    testWidgets('should display helper text for URL',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Server base URL (e.g., http://192.168.1.100)'),
          findsOneWidget);
    });

    testWidgets('should display helper text for port',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Server port (1-65535)'), findsOneWidget);
    });

    testWidgets('should display hint text for URL',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.text('http://10.84.107.120'), findsOneWidget);
    });

    testWidgets('should display hint text for port',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      // The hint text "8080" appears in both the text field and as a Text widget
      expect(find.text('8080'), findsWidgets);
    });

    testWidgets('should have Card widgets', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Card),
          findsNWidgets(2)); // Info card and Network Requirements card
    });

    testWidgets('should have Divider widgets in Network Requirements',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SettingsPage()),
      );
      await tester.pumpAndSettle();

      expect(find.byType(Divider), findsNWidgets(2));
    });
  });
}
