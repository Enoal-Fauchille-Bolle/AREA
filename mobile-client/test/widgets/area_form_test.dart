import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/area_form.dart';

void main() {
  group('AreaForm', () {
    late TextEditingController actionController;
    late TextEditingController reactionController;
    late GlobalKey<FormState> formKey;

    setUp(() {
      actionController = TextEditingController();
      reactionController = TextEditingController();
      formKey = GlobalKey<FormState>();
    });

    tearDown(() {
      actionController.dispose();
      reactionController.dispose();
    });

    testWidgets('should display action and reaction fields',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
            ),
          ),
        ),
      );

      expect(find.text('Action'), findsOneWidget);
      expect(find.text('Reaction'), findsOneWidget);
    });

    testWidgets('should display default submit button text',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
            ),
          ),
        ),
      );

      expect(find.text('Submit'), findsOneWidget);
    });

    testWidgets('should display custom submit button text',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
              submitButtonText: 'Create Area',
            ),
          ),
        ),
      );

      expect(find.text('Create Area'), findsOneWidget);
    });

    testWidgets('should call onSubmit when button is pressed',
        (WidgetTester tester) async {
      var submitCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () => submitCalled = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      expect(submitCalled, isTrue);
    });

    testWidgets('should validate empty action field',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
              formKey: formKey,
            ),
          ),
        ),
      );

      // Trigger validation
      formKey.currentState!.validate();
      await tester.pumpAndSettle();

      expect(find.text('Enter action'), findsOneWidget);
    });

    testWidgets('should validate empty reaction field',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
              formKey: formKey,
            ),
          ),
        ),
      );

      // Trigger validation
      formKey.currentState!.validate();
      await tester.pumpAndSettle();

      expect(find.text('Enter reaction'), findsOneWidget);
    });

    testWidgets('should update action controller when text is entered',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
            ),
          ),
        ),
      );

      await tester.enterText(
          find.byType(TextFormField).first, 'New email received');
      expect(actionController.text, equals('New email received'));
    });

    testWidgets('should update reaction controller when text is entered',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
            ),
          ),
        ),
      );

      await tester.enterText(
          find.byType(TextFormField).last, 'Send notification');
      expect(reactionController.text, equals('Send notification'));
    });

    testWidgets('should pass validation with filled fields',
        (WidgetTester tester) async {
      actionController.text = 'Action';
      reactionController.text = 'Reaction';

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
              formKey: formKey,
            ),
          ),
        ),
      );

      final isValid = formKey.currentState!.validate();
      await tester.pumpAndSettle();

      expect(isValid, isTrue);
      expect(find.text('Enter action'), findsNothing);
      expect(find.text('Enter reaction'), findsNothing);
    });

    testWidgets('should have scrollable content', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaForm(
              actionController: actionController,
              reactionController: reactionController,
              onSubmit: () {},
            ),
          ),
        ),
      );

      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });
  });
}
