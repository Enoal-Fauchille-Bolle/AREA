import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/area_card.dart';

void main() {
  group('AreaCard', () {
    final testAction = {
      'component': {
        'name': 'New Email',
      },
    };

    final testReaction = {
      'component': {
        'name': 'Send Message',
      },
    };

    testWidgets('should display area name', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Test Area'), findsOneWidget);
    });

    testWidgets('should display area description', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              description: 'Test Description',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Test Description'), findsOneWidget);
    });

    testWidgets('should display Active badge for active areas',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Active'), findsOneWidget);
    });

    testWidgets('should display Inactive badge for inactive areas',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: false,
              triggeredCount: 0,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Inactive'), findsOneWidget);
    });

    testWidgets('should display action component name',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              action: testAction,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('New Email'), findsOneWidget);
    });

    testWidgets('should display reaction component name',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              reaction: testReaction,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Send Message'), findsOneWidget);
    });

    testWidgets('should display trigger count', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('5 times'), findsOneWidget);
    });

    testWidgets('should display "Never" when last_triggered_at is null',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: false,
              triggeredCount: 0,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Never'), findsOneWidget);
    });

    testWidgets('should call onTap when card is tapped',
        (WidgetTester tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(Card));
      await tester.pump();

      expect(tapped, isTrue);
    });

    testWidgets('should display edit button when showActions is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
              showActions: true,
              onEdit: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.edit_outlined), findsOneWidget);
    });

    testWidgets('should display delete button when showActions is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
              showActions: true,
              onDelete: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.delete_outline), findsOneWidget);
    });

    testWidgets('should not display actions when showActions is false',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
              showActions: false,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.edit_outlined), findsNothing);
      expect(find.byIcon(Icons.delete_outline), findsNothing);
    });

    testWidgets('should call onEdit when edit button is tapped',
        (WidgetTester tester) async {
      bool edited = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
              showActions: true,
              onEdit: () => edited = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.edit_outlined));
      await tester.pump();

      expect(edited, isTrue);
    });

    testWidgets('should call onDelete when delete button is tapped',
        (WidgetTester tester) async {
      bool deleted = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
              showActions: true,
              onDelete: () => deleted = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.delete_outline));
      await tester.pump();

      expect(deleted, isTrue);
    });

    testWidgets('should format "Just now" for recent triggers',
        (WidgetTester tester) async {
      final lastTriggered =
          DateTime.now().subtract(const Duration(seconds: 5)).toIso8601String();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 1,
              lastTriggeredAt: lastTriggered,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Just now'), findsOneWidget);
    });

    testWidgets('should format minutes ago for triggers < 1 hour',
        (WidgetTester tester) async {
      final lastTriggered = DateTime.now()
          .subtract(const Duration(minutes: 15))
          .toIso8601String();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 1,
              lastTriggeredAt: lastTriggered,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('m ago'), findsOneWidget);
    });

    testWidgets('should format hours ago for triggers < 24 hours',
        (WidgetTester tester) async {
      final lastTriggered =
          DateTime.now().subtract(const Duration(hours: 5)).toIso8601String();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 1,
              lastTriggeredAt: lastTriggered,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('h ago'), findsOneWidget);
    });

    testWidgets('should format days ago for triggers < 7 days',
        (WidgetTester tester) async {
      final lastTriggered =
          DateTime.now().subtract(const Duration(days: 3)).toIso8601String();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 1,
              lastTriggeredAt: lastTriggered,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('d ago'), findsOneWidget);
    });

    testWidgets('should handle missing action gracefully',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 0,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.byType(AreaCard), findsOneWidget);
      expect(find.text('Unknown'),
          findsNWidgets(2)); // Both action and reaction show "Unknown"
    });

    testWidgets('should handle missing reaction gracefully',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 0,
              action: testAction,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.byType(AreaCard), findsOneWidget);
      expect(find.text('Unknown'),
          findsOneWidget); // Only reaction shows "Unknown"
    });

    testWidgets('should display Action and Reaction labels',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              action: testAction,
              reaction: testReaction,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Action'), findsOneWidget);
      expect(find.text('Reaction'), findsOneWidget);
    });

    testWidgets('should display Triggered and Last Run labels',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 5,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('Triggered'), findsOneWidget);
      expect(find.text('Last Run'), findsOneWidget);
    });

    testWidgets('should handle invalid last_triggered_at gracefully',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AreaCard(
              id: '1',
              name: 'Test Area',
              isActive: true,
              triggeredCount: 1,
              lastTriggeredAt: 'invalid-date',
              onTap: () {},
            ),
          ),
        ),
      );

      // Widget should render without crashing
      expect(find.byType(AreaCard), findsOneWidget);
    });
  });
}
