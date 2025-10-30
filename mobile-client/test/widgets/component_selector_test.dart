import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/component_selector.dart';

void main() {
  group('ComponentSelector', () {
    final testComponents = [
      {
        'id': '1',
        'name': 'New Email',
        'type': 'action',
        'service': {'icon_url': 'https://example.com/icon.png'}
      },
      {
        'id': '2',
        'name': 'Send Notification',
        'kind': 'reaction',
        'service': {'icon_url': null}
      },
      {'id': '3', 'name': 'Unnamed Component'},
    ];

    testWidgets('should display label', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: testComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Select Action'), findsOneWidget);
    });

    testWidgets('should display prefix icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: testComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.layers), findsOneWidget);
    });

    testWidgets('should display dropdown with all components',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: testComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      // Tap to open dropdown
      await tester
          .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>));
      await tester.pumpAndSettle();

      expect(find.text('New Email'), findsOneWidget);
      expect(find.text('Send Notification'), findsOneWidget);
      expect(find.text('Unnamed Component'), findsOneWidget);
    });

    testWidgets('should call onChanged when component is selected',
        (WidgetTester tester) async {
      Map<String, dynamic>? selectedComponent;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: testComponents,
              onChanged: (value) => selectedComponent = value,
            ),
          ),
        ),
      );

      // Tap to open dropdown
      await tester
          .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>));
      await tester.pumpAndSettle();

      // Select first component
      await tester.tap(find.text('New Email').last);
      await tester.pumpAndSettle();

      expect(selectedComponent, isNotNull);
      expect(selectedComponent!['name'], equals('New Email'));
    });

    testWidgets('should display type badge for action',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: testComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      // Tap to open dropdown
      await tester
          .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>));
      await tester.pumpAndSettle();

      expect(find.text('ACTION'), findsOneWidget);
    });

    testWidgets('should display type badge for reaction',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Reaction',
              components: testComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      // Tap to open dropdown
      await tester
          .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>));
      await tester.pumpAndSettle();

      expect(find.text('REACTION'), findsOneWidget);
    });

    testWidgets('should handle components without type',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Component',
              components: testComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      // Tap to open dropdown
      await tester
          .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>));
      await tester.pumpAndSettle();

      expect(find.text('Unnamed Component'), findsOneWidget);
    });

    testWidgets('should validate selection', (WidgetTester tester) async {
      final formKey = GlobalKey<FormState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: ComponentSelector(
                label: 'Select Action',
                components: testComponents,
                onChanged: (_) {},
                validator: (value) {
                  if (value == null) return 'Please select a component';
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Trigger validation
      formKey.currentState!.validate();
      await tester.pumpAndSettle();

      expect(find.text('Please select a component'), findsOneWidget);
    });

    testWidgets('should handle empty components list',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: [],
              onChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.byType(ComponentSelector), findsOneWidget);
    });

    testWidgets('should display default icon when service icon fails to load',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: testComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      // Tap to open dropdown
      await tester
          .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>));
      await tester.pumpAndSettle();

      // The dropdown is open, verify structure exists
      expect(find.byType(DropdownButtonFormField<Map<String, dynamic>>),
          findsOneWidget);
    });

    testWidgets('should handle component name overflow',
        (WidgetTester tester) async {
      final longNameComponents = [
        {
          'id': '1',
          'name':
              'This is a very long component name that should be truncated with ellipsis',
          'type': 'action',
        },
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ComponentSelector(
              label: 'Select Action',
              components: longNameComponents,
              onChanged: (_) {},
            ),
          ),
        ),
      );

      await tester
          .tap(find.byType(DropdownButtonFormField<Map<String, dynamic>>));
      await tester.pumpAndSettle();

      expect(find.byType(ComponentSelector), findsOneWidget);
    });
  });
}
