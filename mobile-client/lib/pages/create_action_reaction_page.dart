import 'package:flutter/material.dart';
import '../services/area_api_service.dart';
import '../services/service_api_service.dart';
import '../widgets/component_selector.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';

class CreateActionReactionPage extends StatefulWidget {
  const CreateActionReactionPage({super.key});

  @override
  State<CreateActionReactionPage> createState() =>
      _CreateActionReactionPageState();
}

class _CreateActionReactionPageState extends State<CreateActionReactionPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final AreaApiService _areaApi = AreaApiService();
  final ServiceApiService _serviceApi = ServiceApiService();

  List<Map<String, dynamic>> _availableActions = [];
  List<Map<String, dynamic>> _availableReactions = [];
  Map<String, dynamic>? _selectedAction;
  Map<String, dynamic>? _selectedReaction;
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadComponents();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadComponents() async {
    try {
      setState(() => _isLoading = true);

      // Get all linked services
      final services = await _serviceApi.fetchUserServices();
      print('Loaded ${services.length} linked services for creating AREA');

      // Fetch actions and reactions for each service
      final List<Map<String, dynamic>> actions = [];
      final List<Map<String, dynamic>> reactions = [];

      for (final service in services) {
        try {
          // User service records have 'service_id', not 'id'
          final serviceId = service['service_id'];
          if (serviceId == null) {
            print('Skipping service with null service_id');
            continue;
          }

          print('Loading components for service ID: $serviceId');
          final components = await _serviceApi.fetchServiceComponents(
            serviceId.toString(),
          );

          for (final component in components) {
            if (component['type'] == 'action') {
              actions.add(component);
            } else if (component['type'] == 'reaction') {
              reactions.add(component);
            }
          }
        } catch (e) {
          print(
              'Error loading components for service ${service['service_id']}: $e');
        }
      }

      print(
          'Loaded ${actions.length} actions and ${reactions.length} reactions');
      setState(() {
        _availableActions = actions;
        _availableReactions = reactions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading components: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedAction == null || _selectedReaction == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select both an action and a reaction'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Extract component IDs
      final actionId = _selectedAction!['id'];
      final reactionId = _selectedReaction!['id'];

      print(
          'Creating AREA with action ID: $actionId, reaction ID: $reactionId');
      final result = await _areaApi.createArea(
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        componentActionId: actionId,
        componentReactionId: reactionId,
        isActive: true,
      );
      print('AREA created successfully: $result');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('AREA created successfully!')),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      print('Error creating AREA: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error creating AREA: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: const Text('Create AREA'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _availableActions.isEmpty || _availableReactions.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.link_off, size: 64, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          'No services linked',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Please link services first to create AREAs',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.arrow_back),
                          label: const Text('Go Back'),
                        ),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Name field
                        CustomTextField(
                          controller: _nameController,
                          label: 'AREA Name',
                          hint: 'e.g., Email to Discord',
                          prefixIcon: Icons.title,
                          validator: (v) => v == null || v.isEmpty
                              ? 'Please enter a name'
                              : null,
                        ),
                        const SizedBox(height: 16),

                        // Description field
                        CustomTextField(
                          controller: _descriptionController,
                          label: 'Description (optional)',
                          hint: 'What does this AREA do?',
                          prefixIcon: Icons.description,
                          maxLines: 3,
                        ),
                        const SizedBox(height: 24),

                        // Action selector
                        Text(
                          'When this happens...',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        const SizedBox(height: 8),
                        ComponentSelector(
                          label: 'Select Action (Trigger)',
                          components: _availableActions,
                          onChanged: (component) {
                            setState(() => _selectedAction = component);
                          },
                          validator: (v) =>
                              v == null ? 'Please select an action' : null,
                        ),
                        const SizedBox(height: 24),

                        // Reaction selector
                        Text(
                          'Do this...',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        const SizedBox(height: 8),
                        ComponentSelector(
                          label: 'Select Reaction (Task)',
                          components: _availableReactions,
                          onChanged: (component) {
                            setState(() => _selectedReaction = component);
                          },
                          validator: (v) =>
                              v == null ? 'Please select a reaction' : null,
                        ),
                        const SizedBox(height: 32),

                        // Create button
                        CustomButton(
                          text: 'Create AREA',
                          isLoading: _isSubmitting,
                          onPressed: _handleCreate,
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
