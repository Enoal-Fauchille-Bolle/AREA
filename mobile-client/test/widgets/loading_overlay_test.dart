import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_client/widgets/loading_overlay.dart';

void main() {
  group('LoadingOverlay', () {
    testWidgets('should display child widget when not loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: false,
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      expect(find.text('Child Content'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('should display loading indicator when loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: true,
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Child Content'), findsOneWidget); // Child still present
    });

    testWidgets('should display loading message when provided',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: true,
              message: 'Loading data...',
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      expect(find.text('Loading data...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should not display message when not loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: false,
              message: 'Loading data...',
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      expect(find.text('Loading data...'), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('should display overlay with semi-transparent background',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: true,
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(Stack),
          matching: find.byType(Container),
        ),
      );

      expect(container.color, equals(const Color.fromRGBO(0, 0, 0, 0.5)));
    });

    testWidgets('should toggle between loading and not loading',
        (WidgetTester tester) async {
      bool isLoading = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return Column(
                  children: [
                    Expanded(
                      child: LoadingOverlay(
                        isLoading: isLoading,
                        child: const Text('Child Content'),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => setState(() => isLoading = !isLoading),
                      child: const Text('Toggle'),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      );

      // Initially not loading
      expect(find.byType(CircularProgressIndicator), findsNothing);

      // Toggle to loading
      await tester.tap(find.text('Toggle'));
      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Toggle back to not loading
      await tester.tap(find.text('Toggle'));
      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('should center loading indicator', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: true,
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      expect(
          find.descendant(
            of: find.byType(Container),
            matching: find.byType(Center),
          ),
          findsOneWidget);
    });

    testWidgets('should use Stack to overlay content',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: true,
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      expect(find.byType(LoadingOverlay), findsOneWidget);
      expect(find.byType(Stack), findsWidgets);
    });

    testWidgets('should not show message without loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: LoadingOverlay(
              isLoading: false,
              message: 'Please wait...',
              child: Text('Child Content'),
            ),
          ),
        ),
      );

      expect(find.text('Please wait...'), findsNothing);
    });
  });
}
