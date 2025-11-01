import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/password_field.dart';

void main() {
  group('PasswordField', () {
    late TextEditingController controller;

    setUp(() {
      controller = TextEditingController();
    });

    tearDown(() {
      controller.dispose();
    });

    testWidgets('should display default label', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(controller: controller),
          ),
        ),
      );

      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('should display custom label', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(
              controller: controller,
              label: 'Confirm Password',
            ),
          ),
        ),
      );

      expect(find.text('Confirm Password'), findsOneWidget);
    });

    testWidgets('should display hint text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(
              controller: controller,
              hint: 'Enter your password',
            ),
          ),
        ),
      );

      expect(find.text('Enter your password'), findsOneWidget);
    });

    testWidgets('should obscure text by default', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(controller: controller),
          ),
        ),
      );

      await tester.enterText(find.byType(PasswordField), 'secret123');
      expect(controller.text, equals('secret123'));

      // Visibility icon should be present (text is hidden)
      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('should toggle visibility when icon is tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(controller: controller),
          ),
        ),
      );

      // Initially should show visibility icon (password hidden)
      expect(find.byIcon(Icons.visibility), findsOneWidget);
      expect(find.byIcon(Icons.visibility_off), findsNothing);

      // Tap the visibility toggle
      await tester.tap(find.byIcon(Icons.visibility));
      await tester.pumpAndSettle();

      // Now should show visibility_off icon (password visible)
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
      expect(find.byIcon(Icons.visibility), findsNothing);

      // Tap again to hide
      await tester.tap(find.byIcon(Icons.visibility_off));
      await tester.pumpAndSettle();

      // Back to visibility icon (password hidden)
      expect(find.byIcon(Icons.visibility), findsOneWidget);
      expect(find.byIcon(Icons.visibility_off), findsNothing);
    });

    testWidgets('should display lock icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(controller: controller),
          ),
        ),
      );

      expect(find.byIcon(Icons.lock_outlined), findsOneWidget);
    });

    testWidgets('should update controller when text is entered',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(controller: controller),
          ),
        ),
      );

      await tester.enterText(find.byType(PasswordField), 'mypassword');
      expect(controller.text, equals('mypassword'));
    });

    testWidgets('should call validator', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              child: PasswordField(
                controller: controller,
                validator: (value) {
                  if (value == null || value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Trigger validation with empty field
      final formState = tester.state<FormState>(find.byType(Form));
      formState.validate();
      await tester.pumpAndSettle();

      expect(
          find.text('Password must be at least 6 characters'), findsOneWidget);
    });

    testWidgets('should call onFieldSubmitted', (WidgetTester tester) async {
      String? submittedText;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(
              controller: controller,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (value) => submittedText = value,
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(PasswordField), 'password123');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pumpAndSettle();

      expect(submittedText, equals('password123'));
    });

    testWidgets('should apply text input action', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PasswordField(
              controller: controller,
              textInputAction: TextInputAction.next,
            ),
          ),
        ),
      );

      expect(find.byType(PasswordField), findsOneWidget);
    });
  });
}
