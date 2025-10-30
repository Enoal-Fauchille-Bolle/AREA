import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/pages/login_page.dart';
import 'package:mobile_client/widgets/custom_button.dart';
import 'package:mobile_client/widgets/custom_text_field.dart';
import 'package:mobile_client/widgets/password_field.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('LoginPage UI Elements', () {
    testWidgets('should display lock icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byIcon(Icons.lock_outline), findsOneWidget);
    });

    testWidgets('should display Welcome Back title',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text('Welcome Back'), findsOneWidget);
    });

    testWidgets('should display Sign in to your account subtitle',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text('Sign in to your account'), findsOneWidget);
    });

    testWidgets('should display email field', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.widgetWithText(CustomTextField, 'Email'), findsOneWidget);
    });

    testWidgets('should display password field', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.widgetWithText(PasswordField, 'Password'), findsOneWidget);
    });

    testWidgets('should display Sign In button', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.widgetWithText(CustomButton, 'Sign In'), findsOneWidget);
    });

    testWidgets('should display OAuth divider text',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text('Or continue with'), findsOneWidget);
    });

    testWidgets('should display Discord OAuth button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text('Discord'), findsOneWidget);
    });

    testWidgets('should display GitHub OAuth button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text('GitHub'), findsOneWidget);
    });

    testWidgets('should display Google OAuth button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text('Continue with Google'), findsOneWidget);
    });

    testWidgets('should display Forgot Password button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text('Forgot Password?'), findsOneWidget);
    });

    testWidgets('should display Sign Up link', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.text("Don't have an account? "), findsOneWidget);
      expect(find.text('Sign Up'), findsOneWidget);
    });
  });

  group('LoginPage Validation', () {
    testWidgets('should show error for empty email',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      await tester.tap(find.widgetWithText(CustomButton, 'Sign In'));
      await tester.pump();

      expect(find.text('Please enter your email'), findsOneWidget);
    });

    testWidgets('should show error for invalid email format',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      await tester.enterText(
          find.widgetWithText(CustomTextField, 'Email'), 'invalid-email');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign In'));
      await tester.pump();

      expect(find.text('Please enter a valid email address'), findsOneWidget);
    });

    testWidgets('should show error for empty password',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      await tester.enterText(
          find.widgetWithText(CustomTextField, 'Email'), 'test@example.com');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign In'));
      await tester.pump();

      expect(find.text('Please enter your password'), findsOneWidget);
    });

    testWidgets('should show error for short password',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      await tester.enterText(
          find.widgetWithText(CustomTextField, 'Email'), 'test@example.com');
      await tester.enterText(
          find.widgetWithText(PasswordField, 'Password'), '12345');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign In'));
      await tester.pump();

      expect(find.text('Password must be at least 6 characters long'),
          findsOneWidget);
    });

    testWidgets('should accept valid email format',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      await tester.enterText(
          find.widgetWithText(CustomTextField, 'Email'), 'test@example.com');
      await tester.enterText(
          find.widgetWithText(PasswordField, 'Password'), 'password123');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign In'));
      await tester.pump();

      expect(find.text('Please enter your email'), findsNothing);
      expect(find.text('Please enter a valid email address'), findsNothing);
    });
  });

  group('LoginPage Interactions', () {
    testWidgets('should show snackbar when Forgot Password is tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginPage(),
        ),
      );

      // Find and tap the Forgot Password button
      final forgotPasswordButton = find
          .ancestor(
            of: find.text('Forgot Password?'),
            matching: find.byType(TextButton),
          )
          .first;

      await tester.ensureVisible(forgotPasswordButton);
      await tester.pumpAndSettle();

      await tester.tap(forgotPasswordButton);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Forgot password feature coming soon!'), findsOneWidget);
    });

    testWidgets('should be scrollable', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });

    testWidgets('should use SafeArea', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byType(SafeArea), findsOneWidget);
    });

    testWidgets('should have form key', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byType(Form), findsOneWidget);
    });

    testWidgets('should have email icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byIcon(Icons.email_outlined), findsOneWidget);
    });

    testWidgets('should have Discord icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byIcon(Icons.discord), findsOneWidget);
    });

    testWidgets('should have GitHub icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byIcon(Icons.code), findsOneWidget);
    });

    testWidgets('should have Google icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: LoginPage()),
      );

      expect(find.byIcon(Icons.g_mobiledata), findsOneWidget);
    });
  });
}
