import 'package:flutter/material.dart';
import '../services/area_api_service.dart';
import '../widgets/area_form.dart';

class CreateActionReactionPage extends StatefulWidget {
  const CreateActionReactionPage({super.key});

  @override
  State<CreateActionReactionPage> createState() =>
      _CreateActionReactionPageState();
}

class _CreateActionReactionPageState extends State<CreateActionReactionPage> {
  final _formKey = GlobalKey<FormState>();
  final _actionController = TextEditingController();
  final _reactionController = TextEditingController();
  final AreaApiService api = AreaApiService();

  @override
  void dispose() {
    _actionController.dispose();
    _reactionController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;
    try {
      await api.createArea(_actionController.text, _reactionController.text);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Action/Reaction created!')),
      );
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(title: const Text('Create Action/Reaction')),
      body: AreaForm(
        formKey: _formKey,
        actionController: _actionController,
        reactionController: _reactionController,
        submitButtonText: 'Create',
        onSubmit: _handleCreate,
      ),
    );
  }
}
