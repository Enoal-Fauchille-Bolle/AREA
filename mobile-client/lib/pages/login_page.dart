import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/discord_oauth_service.dart';
import '../services/github_oauth_service.dart';
import '../services/google_oauth_service.dart';
import '../services/runtime_config.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/password_field.dart';
import '../widgets/custom_button.dart';
import 'home_page.dart';
import 'sign_up_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();

  bool _isLoading = false;
  bool _isOAuthLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final success = await _authService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (success && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const HomePage()),
        );
      } else if (mounted) {
        _showErrorDialog('Invalid email or password. Please try again.');
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('An error occurred. Please try again later.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Login Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleDiscordLogin() async {
    setState(() {
      _isOAuthLoading = true;
    });

    try {
      final code = await DiscordOAuthService.authorize(
          context); // forService: false par défaut
      if (code != null && mounted) {
        // Use the same redirect URI that was used to get the code
        final redirectUri =
            await DiscordOAuthService.getRedirectUri(forService: false);

        final success =
            await _authService.loginOAuth2('discord', code, redirectUri);

        if (success && mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else if (mounted) {
          _showErrorDialog('Discord login failed. Please try again.');
        }
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('Discord authorization failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isOAuthLoading = false;
        });
      }
    }
  }

  Future<void> _handleGithubLogin() async {
    setState(() {
      _isOAuthLoading = true;
    });

    try {
      final code = await GithubOAuthService.authorize(
          context); // forService: false par défaut
      if (code != null && mounted) {
        // Use the same redirect URI that was used to get the code
        final redirectUri =
            await GithubOAuthService.getRedirectUri(forService: false);

        final success =
            await _authService.loginOAuth2('github', code, redirectUri);

        if (success && mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else if (mounted) {
          _showErrorDialog('GitHub login failed. Please try again.');
        }
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('GitHub authorization failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isOAuthLoading = false;
        });
      }
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() {
      _isOAuthLoading = true;
    });

    try {
      final code = await GoogleOAuthService.authorize(context);
      if (code != null && mounted) {
        final baseUrl = await RuntimeConfig().getServerUrl();
        final redirectUri = '$baseUrl/auth/callback';

        final success =
            await _authService.loginOAuth2('google', code, redirectUri);

        if (success && mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else if (mounted) {
          _showErrorDialog('Google login failed. Please try again.');
        }
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('Google authorization failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isOAuthLoading = false;
        });
      }
    }
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your password';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo/Title Section
                  Icon(
                    Icons.lock_outline,
                    size: 80,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Welcome Back',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to your account',
                    style: Theme.of(context).textTheme.bodyLarge,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48),

                  // Email Field
                  CustomTextField(
                    controller: _emailController,
                    label: 'Email',
                    hint: 'Enter your email address',
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: _validateEmail,
                  ),
                  const SizedBox(height: 16),

                  // Password Field
                  PasswordField(
                    controller: _passwordController,
                    label: 'Password',
                    hint: 'Enter your password',
                    textInputAction: TextInputAction.done,
                    validator: _validatePassword,
                    onFieldSubmitted: (_) => _handleLogin(),
                  ),
                  const SizedBox(height: 24),

                  // Login Button
                  CustomButton(
                    text: 'Sign In',
                    isLoading: _isLoading,
                    onPressed: _handleLogin,
                  ),
                  const SizedBox(height: 24),

                  // Divider
                  Row(
                    children: [
                      const Expanded(child: Divider()),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text(
                          'Or continue with',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                      const Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // OAuth Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed:
                              _isOAuthLoading ? null : _handleDiscordLogin,
                          icon: const Icon(Icons.discord,
                              color: Color(0xFF5865F2)),
                          label: const Text('Discord'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed:
                              _isOAuthLoading ? null : _handleGithubLogin,
                          icon: const Icon(Icons.code),
                          label: const Text('GitHub'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Google Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _isOAuthLoading ? null : _handleGoogleLogin,
                      icon: const Icon(Icons.g_mobiledata, size: 32),
                      label: const Text('Continue with Google'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Forgot Password
                  TextButton(
                    onPressed: () {
                      // TODO: Implement forgot password functionality
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Forgot password feature coming soon!'),
                        ),
                      );
                    },
                    child: const Text('Forgot Password?'),
                  ),
                  const SizedBox(height: 32),

                  // Sign Up Link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Don't have an account? ",
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const SignUpPage(),
                            ),
                          );
                        },
                        child: const Text('Sign Up'),
                      ),
                    ],
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
