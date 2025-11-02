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
import 'verify_email_page.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _authService = AuthService();

  bool _isLoading = false;
  bool _isOAuthLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleSignUp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final success = await _authService.register(
        _emailController.text.trim(),
        _usernameController.text.trim(),
        _passwordController.text,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Account created! Please verify your email.')),
        );
        // Navigate to email verification page
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) =>
                VerifyEmailPage(email: _emailController.text.trim()),
          ),
        );
      } else if (mounted) {
        _showErrorDialog('Failed to create account. Please try again.');
      }
    } catch (e) {
      if (mounted) {
        _showErrorDialog('An error occurred: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Up Error'),
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

  Future<void> _handleDiscordSignUp() async {
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
            await _authService.registerOAuth2('discord', code, redirectUri);

        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account created successfully!')),
          );
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else if (mounted) {
          _showErrorDialog('Discord sign up failed. Please try again.');
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

  Future<void> _handleGithubSignUp() async {
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
            await _authService.registerOAuth2('github', code, redirectUri);

        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account created successfully!')),
          );
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else if (mounted) {
          _showErrorDialog('GitHub sign up failed. Please try again.');
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

  Future<void> _handleGoogleSignUp() async {
    setState(() {
      _isOAuthLoading = true;
    });

    try {
      final code = await GoogleOAuthService.authorize(context);
      if (code != null && mounted) {
        final baseUrl = await RuntimeConfig().getServerUrl();
        final redirectUri = '$baseUrl/auth/callback';

        final success =
            await _authService.registerOAuth2('google', code, redirectUri);

        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account created successfully!')),
          );
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else if (mounted) {
          _showErrorDialog('Google sign up failed. Please try again.');
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
    if (value == null || value.isEmpty) return 'Enter your email';
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
      return 'Invalid email';
    }
    return null;
  }

  String? _validateUsername(String? value) {
    if (value == null || value.isEmpty) {
      return 'Enter your username';
    }
    if (value.length < 3) {
      return 'Min 3 characters';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Enter your password';
    }
    if (value.length < 6) {
      return 'Min 6 characters';
    }
    return null;
  }

  String? _validateConfirm(String? value) {
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CustomTextField(
                  controller: _emailController,
                  label: 'Email',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: _validateEmail,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _usernameController,
                  label: 'Username',
                  prefixIcon: Icons.person_outline,
                  validator: _validateUsername,
                ),
                const SizedBox(height: 16),
                PasswordField(
                  controller: _passwordController,
                  label: 'Password',
                  validator: _validatePassword,
                ),
                const SizedBox(height: 16),
                PasswordField(
                  controller: _confirmController,
                  label: 'Confirm Password',
                  validator: _validateConfirm,
                ),
                const SizedBox(height: 32),
                CustomButton(
                  text: 'Sign Up',
                  isLoading: _isLoading,
                  onPressed: _handleSignUp,
                ),
                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Text(
                        'Or sign up with',
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
                            _isOAuthLoading ? null : _handleDiscordSignUp,
                        icon:
                            const Icon(Icons.discord, color: Color(0xFF5865F2)),
                        label: const Text('Discord'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _isOAuthLoading ? null : _handleGithubSignUp,
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
                    onPressed: _isOAuthLoading ? null : _handleGoogleSignUp,
                    icon: const Icon(Icons.g_mobiledata, size: 32),
                    label: const Text('Continue with Google'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
