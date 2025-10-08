// lib/widgets/area_form.dart
import 'package:flutter/material.dart';

class AreaForm extends StatelessWidget {
  final TextEditingController actionController;
  final TextEditingController reactionController;
  final VoidCallback onSubmit;
  final String submitButtonText;
  final GlobalKey<FormState>? formKey;

  const AreaForm({
    super.key,
    required this.actionController,
    required this.reactionController,
    required this.onSubmit,
    this.submitButtonText = 'Submit',
    this.formKey,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: actionController,
              decoration: const InputDecoration(labelText: 'Action'),
              validator: (v) => v == null || v.isEmpty ? 'Enter action' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: reactionController,
              decoration: const InputDecoration(labelText: 'Reaction'),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Enter reaction' : null,
            ),
            const SizedBox(height: 32),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: onSubmit,
                child: Text(submitButtonText),
              ),
            ),
            // Add some bottom spacing so the button isn't flush to the keyboard
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
