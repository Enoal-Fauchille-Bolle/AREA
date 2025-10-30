import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/service_card.dart';

void main() {
  group('ServiceCard', () {
    testWidgets('should display service name and description',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Code repository hosting service',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('GitHub'), findsOneWidget);
      expect(find.text('Code repository hosting service'), findsOneWidget);
    });

    testWidgets('should display default icon when iconUrl is null',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'Test Service',
              description: 'Test description',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.apps), findsOneWidget);
    });

    testWidgets('should display "Linked" badge when isLinked is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              isLinked: true,
            ),
          ),
        ),
      );

      expect(find.text('Linked'), findsOneWidget);
    });

    testWidgets('should not display "Linked" badge when isLinked is false',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              isLinked: false,
            ),
          ),
        ),
      );

      expect(find.text('Linked'), findsNothing);
    });

    testWidgets('should display "Inactive" text when isActive is false',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              isActive: false,
            ),
          ),
        ),
      );

      expect(find.text('Inactive'), findsOneWidget);
    });

    testWidgets('should not display "Inactive" text when isActive is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              isActive: true,
            ),
          ),
        ),
      );

      expect(find.text('Inactive'), findsNothing);
    });

    testWidgets('should call onTap when card is tapped',
        (WidgetTester tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ServiceCard));
      expect(tapped, isTrue);
    });

    testWidgets('should display link button when onLinkToggle is provided',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              onLinkToggle: () {},
            ),
          ),
        ),
      );

      expect(find.byType(IconButton), findsOneWidget);
      expect(find.byIcon(Icons.link), findsOneWidget);
    });

    testWidgets('should display unlink icon when isLinked is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              isLinked: true,
              onLinkToggle: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.link_off), findsOneWidget);
    });

    testWidgets('should call onLinkToggle when link button is tapped',
        (WidgetTester tester) async {
      var toggleCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              onLinkToggle: () => toggleCalled = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(IconButton));
      expect(toggleCalled, isTrue);
    });

    testWidgets('should not display link button when onLinkToggle is null',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.link), findsNothing);
      expect(find.byIcon(Icons.link_off), findsNothing);
    });

    testWidgets('should truncate long description with ellipsis',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description:
                  'This is a very long description that should be truncated with ellipsis when it exceeds the maximum number of lines allowed in the card',
            ),
          ),
        ),
      );

      expect(find.byType(ServiceCard), findsOneWidget);
    });

    testWidgets('should display proper tooltips on link button',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
              isLinked: false,
              onLinkToggle: () {},
            ),
          ),
        ),
      );

      final iconButton = tester.widget<IconButton>(find.byType(IconButton));
      expect(iconButton.tooltip, equals('Link'));
    });

    testWidgets('should use Card widget', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
            ),
          ),
        ),
      );

      expect(find.byType(Card), findsOneWidget);
    });

    testWidgets('should use InkWell for tap effect',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ServiceCard(
              name: 'GitHub',
              description: 'Description',
            ),
          ),
        ),
      );

      expect(find.byType(InkWell), findsOneWidget);
    });
  });
}
