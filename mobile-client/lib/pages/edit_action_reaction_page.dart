import 'package:flutter/material.dart';
import '../services/area_api_service.dart';
import '../widgets/area_form.dart';

class EditActionReactionPage extends StatefulWidget {
  final int areaId;
  final String initialAction;
  final String initialReaction;
  const EditActionReactionPage({
    super.key,
    required this.areaId,
    required this.initialAction,
    required this.initialReaction,
  });

  @override
  State<EditActionReactionPage> createState() => _EditActionReactionPageState();
}

class _EditActionReactionPageState extends State<EditActionReactionPage> {
  final _actionController = TextEditingController();
  final _reactionController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final AreaApiService api = AreaApiService();

  @override
  void initState() {
    super.initState();
    _actionController.text = widget.initialAction;
    _reactionController.text = widget.initialReaction;
  }

  @override
  void dispose() {
    _actionController.dispose();
    _reactionController.dispose();
    super.dispose();
  }

  Future<void> _handleEdit() async {
    if (!_formKey.currentState!.validate()) return;
    try {
      await api.editArea(
        widget.areaId,
        _actionController.text,
        _reactionController.text,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Action/Reaction updated!')),
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
      appBar: AppBar(title: const Text('Edit Action/Reaction')),
      body: AreaForm(
        formKey: _formKey,
        actionController: _actionController,
        reactionController: _reactionController,
        submitButtonText: 'Save Changes',
        onSubmit: _handleEdit,
      ),
    );
  }
}
