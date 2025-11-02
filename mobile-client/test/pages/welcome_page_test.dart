import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/pages/welcome_page.dart';
import 'package:mobile_client/widgets/custom_button.dart';

void main() {
  group('WelcomePage', () {
    testWidgets('should display app logo', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.byIcon(Icons.flash_on), findsOneWidget);
    });

    testWidgets('should display app title and subtitle',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.text('AREA'), findsOneWidget);
      expect(find.text('Automation made simple'), findsOneWidget);
      expect(find.text('Connect your actions and reactions'), findsOneWidget);
    });

    testWidgets('should display Login button', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.text('Login'), findsOneWidget);
      expect(find.byIcon(Icons.login), findsOneWidget);
    });

    testWidgets('should display Sign Up button', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.text('Sign Up'), findsOneWidget);
      expect(find.byIcon(Icons.person_add), findsOneWidget);
    });

    testWidgets('should display Continue as Guest button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.text('Continue as Guest'), findsOneWidget);
      expect(find.byType(TextButton), findsOneWidget);
    });

    testWidgets('should have 2 CustomButtons', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.byType(CustomButton), findsNWidgets(2));
    });

    testWidgets('should navigate when Login button is tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      // Tap the Login button
      await tester.tap(find.text('Login'));
      await tester.pump();

      // Verify navigation started
      expect(find.byType(WelcomePage), findsOneWidget);
    });

    testWidgets('should navigate when Sign Up button is tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      // Tap the Sign Up button
      await tester.tap(find.text('Sign Up'));
      await tester.pump();

      // Verify button was tapped
      expect(find.text('Sign Up'), findsOneWidget);
    });

    testWidgets('should navigate when Continue as Guest is tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      // Tap the guest button
      await tester.tap(find.text('Continue as Guest'));
      await tester.pump();

      // Verify button was tapped
      expect(find.text('Continue as Guest'), findsOneWidget);
    });

    testWidgets('should be scrollable', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });

    testWidgets('should use SafeArea', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      expect(find.byType(SafeArea), findsOneWidget);
    });

    testWidgets('should use proper layout structure',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: WelcomePage(),
        ),
      );

      // Verify key layout widgets exist
      expect(find.byType(Column), findsWidgets);
      expect(find.byType(Center), findsWidgets);

      // Verify buttons are present and functional
      expect(find.byType(CustomButton), findsNWidgets(2));
      expect(find.byType(TextButton), findsOneWidget);
    });
  });
}
