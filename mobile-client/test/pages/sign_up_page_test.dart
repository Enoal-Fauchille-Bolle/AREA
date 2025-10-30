import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/pages/sign_up_page.dart';
import 'package:mobile_client/widgets/custom_button.dart';
import 'package:mobile_client/widgets/custom_text_field.dart';
import 'package:mobile_client/widgets/password_field.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('SignUpPage UI Elements', () {
    testWidgets('should display app bar with title',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.widgetWithText(AppBar, 'Sign Up'), findsOneWidget);
    });

    testWidgets('should display email field', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.widgetWithText(CustomTextField, 'Email'), findsOneWidget);
    });

    testWidgets('should display username field', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.widgetWithText(CustomTextField, 'Username'), findsOneWidget);
    });

    testWidgets('should display password field', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      final passwordFields = find.widgetWithText(PasswordField, 'Password');
      expect(passwordFields, findsOneWidget);
    });

    testWidgets('should display confirm password field',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.widgetWithText(PasswordField, 'Confirm Password'),
          findsOneWidget);
    });

    testWidgets('should display Sign Up button', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.widgetWithText(CustomButton, 'Sign Up'), findsOneWidget);
    });

    testWidgets('should display OAuth divider', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.text('Or sign up with'), findsOneWidget);
    });

    testWidgets('should display Discord OAuth button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.text('Discord'), findsOneWidget);
    });

    testWidgets('should display GitHub OAuth button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.text('GitHub'), findsOneWidget);
    });

    testWidgets('should display Google OAuth button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.text('Continue with Google'), findsOneWidget);
    });
  });

  group('SignUpPage Validation', () {
    testWidgets('should show error for empty email',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      await tester.tap(find.widgetWithText(CustomButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Enter your email'), findsOneWidget);
    });

    testWidgets('should show error for invalid email',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      final emailFields = tester.widgetList<CustomTextField>(
        find.byType(CustomTextField),
      );
      final emailField = emailFields.first;

      await tester.enterText(
        find.byWidget(emailField),
        'invalid-email',
      );
      await tester.tap(find.widgetWithText(CustomButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Invalid email'), findsOneWidget);
    });

    testWidgets('should show error for empty username',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      final emailFields = tester.widgetList<CustomTextField>(
        find.byType(CustomTextField),
      );
      final emailField = emailFields.first;

      await tester.enterText(
        find.byWidget(emailField),
        'test@example.com',
      );
      await tester.tap(find.widgetWithText(CustomButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Enter your username'), findsOneWidget);
    });

    testWidgets('should show error for short username',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      final customTextFields = tester
          .widgetList<CustomTextField>(
            find.byType(CustomTextField),
          )
          .toList();

      await tester.enterText(
          find.byWidget(customTextFields[0]), 'test@example.com');
      await tester.enterText(find.byWidget(customTextFields[1]), 'ab');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Min 3 characters'), findsOneWidget);
    });

    testWidgets('should show error for empty password',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      final customTextFields = tester
          .widgetList<CustomTextField>(
            find.byType(CustomTextField),
          )
          .toList();

      await tester.enterText(
          find.byWidget(customTextFields[0]), 'test@example.com');
      await tester.enterText(find.byWidget(customTextFields[1]), 'testuser');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Enter your password'), findsOneWidget);
    });

    testWidgets('should show error for short password',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      final customTextFields = tester
          .widgetList<CustomTextField>(
            find.byType(CustomTextField),
          )
          .toList();
      final passwordFields = tester
          .widgetList<PasswordField>(
            find.byType(PasswordField),
          )
          .toList();

      await tester.enterText(
          find.byWidget(customTextFields[0]), 'test@example.com');
      await tester.enterText(find.byWidget(customTextFields[1]), 'testuser');
      await tester.enterText(find.byWidget(passwordFields[0]), '12345');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Min 6 characters'), findsWidgets);
    });

    testWidgets('should show error for non-matching passwords',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      final customTextFields = tester
          .widgetList<CustomTextField>(
            find.byType(CustomTextField),
          )
          .toList();
      final passwordFields = tester
          .widgetList<PasswordField>(
            find.byType(PasswordField),
          )
          .toList();

      await tester.enterText(
          find.byWidget(customTextFields[0]), 'test@example.com');
      await tester.enterText(find.byWidget(customTextFields[1]), 'testuser');
      await tester.enterText(find.byWidget(passwordFields[0]), 'password123');
      await tester.enterText(find.byWidget(passwordFields[1]), 'different123');
      await tester.tap(find.widgetWithText(CustomButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Passwords do not match'), findsOneWidget);
    });
  });

  group('SignUpPage Interactions', () {
    testWidgets('should be scrollable', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });

    testWidgets('should have form key', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byType(Form), findsOneWidget);
    });

    testWidgets('should have email icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byIcon(Icons.email_outlined), findsOneWidget);
    });

    testWidgets('should have person icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byIcon(Icons.person_outline), findsOneWidget);
    });

    testWidgets('should have Discord icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byIcon(Icons.discord), findsOneWidget);
    });

    testWidgets('should have GitHub icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byIcon(Icons.code), findsOneWidget);
    });

    testWidgets('should have Google icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byIcon(Icons.g_mobiledata), findsOneWidget);
    });

    testWidgets('should have Divider widgets', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignUpPage()),
      );

      expect(find.byType(Divider), findsNWidgets(2));
    });
  });
}
