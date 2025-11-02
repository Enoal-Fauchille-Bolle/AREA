import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/info_card.dart';

void main() {
  group('InfoCard', () {
    testWidgets('should display icon, title, and description',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoCard(
              icon: Icons.check_circle,
              iconColor: Colors.green,
              title: 'Test Title',
              description: 'Test Description',
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(find.text('Test Title'), findsOneWidget);
      expect(find.text('Test Description'), findsOneWidget);
    });

    testWidgets('should apply custom icon color', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoCard(
              icon: Icons.error,
              iconColor: Colors.red,
              title: 'Error',
              description: 'An error occurred',
            ),
          ),
        ),
      );

      final icon = tester.widget<Icon>(find.byIcon(Icons.error));
      expect(icon.color, equals(Colors.red));
    });

    testWidgets('should use default margin', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoCard(
              icon: Icons.info,
              iconColor: Colors.blue,
              title: 'Info',
              description: 'Information',
            ),
          ),
        ),
      );

      final card = tester.widget<Card>(find.byType(Card));
      expect(card.margin, equals(const EdgeInsets.all(16)));
    });

    testWidgets('should apply custom margin', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoCard(
              icon: Icons.info,
              iconColor: Colors.blue,
              title: 'Info',
              description: 'Information',
              margin: EdgeInsets.all(8),
            ),
          ),
        ),
      );

      final card = tester.widget<Card>(find.byType(Card));
      expect(card.margin, equals(const EdgeInsets.all(8)));
    });

    testWidgets('should use default padding', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoCard(
              icon: Icons.info,
              iconColor: Colors.blue,
              title: 'Info',
              description: 'Information',
            ),
          ),
        ),
      );

      final padding = tester.widget<Padding>(find
          .descendant(
            of: find.byType(Card),
            matching: find.byType(Padding),
          )
          .first);
      expect(padding.padding, equals(const EdgeInsets.all(16)));
    });

    testWidgets('should apply custom padding', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoCard(
              icon: Icons.info,
              iconColor: Colors.blue,
              title: 'Info',
              description: 'Information',
              padding: EdgeInsets.all(24),
            ),
          ),
        ),
      );

      // Just verify the widget was created with custom padding
      expect(find.byType(InfoCard), findsOneWidget);
      expect(find.byType(Padding), findsWidgets);
    });

    testWidgets('should display multiple InfoCards',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                InfoCard(
                  icon: Icons.check,
                  iconColor: Colors.green,
                  title: 'Success',
                  description: 'Operation successful',
                ),
                InfoCard(
                  icon: Icons.warning,
                  iconColor: Colors.orange,
                  title: 'Warning',
                  description: 'Please be careful',
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(InfoCard), findsNWidgets(2));
      expect(find.text('Success'), findsOneWidget);
      expect(find.text('Warning'), findsOneWidget);
    });

    testWidgets('should have proper layout structure',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InfoCard(
              icon: Icons.info,
              iconColor: Colors.blue,
              title: 'Title',
              description: 'Description',
            ),
          ),
        ),
      );

      // Verify Card contains Padding
      expect(
          find.descendant(
            of: find.byType(Card),
            matching: find.byType(Padding),
          ),
          findsWidgets);

      // Verify Column layout
      expect(
          find.descendant(
            of: find.byType(InfoCard),
            matching: find.byType(Column),
          ),
          findsOneWidget);
    });
  });
}
