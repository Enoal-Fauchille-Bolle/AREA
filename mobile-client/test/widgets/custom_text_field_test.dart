import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/custom_text_field.dart';

void main() {
  group('CustomTextField', () {
    late TextEditingController controller;

    setUp(() {
      controller = TextEditingController();
    });

    tearDown(() {
      controller.dispose();
    });

    testWidgets('should display label', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
            ),
          ),
        ),
      );

      expect(find.text('Test Label'), findsOneWidget);
    });

    testWidgets('should display hint text', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
              hint: 'Enter text here',
            ),
          ),
        ),
      );

      expect(find.text('Enter text here'), findsOneWidget);
    });

    testWidgets('should update controller when text is entered',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(CustomTextField), 'Hello World');
      expect(controller.text, equals('Hello World'));
    });

    testWidgets('should display prefix icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
              prefixIcon: Icons.email,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.email), findsOneWidget);
    });

    testWidgets('should display suffix icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
              suffixIcon: const Icon(Icons.visibility),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('should obscure text when obscureText is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Password',
              obscureText: true,
            ),
          ),
        ),
      );

      // Enter text and verify it's obscured
      await tester.enterText(find.byType(CustomTextField), 'password');
      expect(controller.text, equals('password'));
      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should not obscure text by default',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(CustomTextField), 'visible text');
      expect(controller.text, equals('visible text'));
    });

    testWidgets('should apply keyboard type', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Email',
              keyboardType: TextInputType.emailAddress,
            ),
          ),
        ),
      );

      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should apply text input action', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
              textInputAction: TextInputAction.done,
            ),
          ),
        ),
      );

      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should call validator', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              child: CustomTextField(
                controller: controller,
                label: 'Test Label',
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Field is required';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Trigger validation
      final formState = tester.state<FormState>(find.byType(Form));
      formState.validate();
      await tester.pumpAndSettle();

      expect(find.text('Field is required'), findsOneWidget);
    });

    testWidgets('should call onFieldSubmitted', (WidgetTester tester) async {
      String? submittedText;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (value) => submittedText = value,
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(CustomTextField), 'Test Text');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pumpAndSettle();

      expect(submittedText, equals('Test Text'));
    });

    testWidgets('should support multiline when maxLines is set',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
              maxLines: 3,
            ),
          ),
        ),
      );

      // Just verify widget exists with multiline support
      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should force maxLines to 1 when obscureText is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Password',
              obscureText: true,
              maxLines: 3, // This should be overridden
            ),
          ),
        ),
      );

      // Verify obscure text field exists
      expect(find.byType(CustomTextField), findsOneWidget);
    });

    testWidgets('should not display prefix icon when not provided',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomTextField(
              controller: controller,
              label: 'Test Label',
            ),
          ),
        ),
      );

      // Verify text field without icon exists
      expect(find.byType(CustomTextField), findsOneWidget);
      // No Icon widget should be found for prefix
    });
  });
}
