import 'package:flutter/material.dart';

/// Password field component with visibility toggle - similar to React/TS PasswordInput
class PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final void Function(String)? onFieldSubmitted;

  const PasswordField({
    super.key,
    required this.controller,
    this.label = 'Password',
    this.hint,
    this.validator,
    this.textInputAction,
    this.onFieldSubmitted,
  });

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _isVisible = false;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: !_isVisible,
      textInputAction: widget.textInputAction,
      validator: widget.validator,
      onFieldSubmitted: widget.onFieldSubmitted,
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        prefixIcon: const Icon(Icons.lock_outlined),
        suffixIcon: IconButton(
          icon: Icon(_isVisible ? Icons.visibility_off : Icons.visibility),
          onPressed: () {
            setState(() {
              _isVisible = !_isVisible;
            });
          },
        ),
      ),
    );
  }
}
