import 'package:flutter/material.dart';
import 'login_page.dart';
import 'sign_up_page.dart';
import '../widgets/custom_button.dart';
import 'actions_reactions_page.dart';

/// Welcome page - First screen shown when app opens
class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: 800),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // App Logo/Icon
                  Icon(
                    Icons.flash_on,
                    size: 100,
                    color: Theme.of(context).primaryColor,
                  ),
                  const SizedBox(height: 24),

                  // App Title
                  Text(
                    'AREA',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 48,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),

                  // App Subtitle
                  Text(
                    'Automation made simple',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),

                  Text(
                    'Connect your actions and reactions',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(color: Colors.grey[500]),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 32),

                  // Login Button
                  CustomButton(
                    text: 'Login',
                    icon: Icons.login,
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (context) => const LoginPage()),
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  // Sign Up Button
                  CustomButton(
                    text: 'Sign Up',
                    icon: Icons.person_add,
                    backgroundColor: Colors.white,
                    textColor: Theme.of(context).primaryColor,
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (context) => const SignUpPage()),
                      );
                    },
                  ),

                  const SizedBox(height: 32),

                  // Guest Mode (optional)
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) =>
                              ActionsReactionsPage(guestMode: true),
                        ),
                      );
                    },
                    child: Text(
                      'Continue as Guest',
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
