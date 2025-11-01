import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'pages/welcome_page.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  try {
    await dotenv.load(fileName: ".env");
    debugPrint('Successfully loaded .env file');
  } catch (e) {
    debugPrint('Warning: Could not load .env file: $e');
    try {
      await dotenv.load(fileName: ".env.example");
      debugPrint('Successfully loaded .env.example file as fallback');
    } catch (e2) {
      debugPrint('Warning: Could not load .env.example file: $e2');
      debugPrint('Using default environment values');
      // Continue with default values if neither file exists
    }
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AREA',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const WelcomePage(),
      debugShowCheckedModeBanner: false,
    );
  }
}
