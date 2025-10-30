import 'package:flutter/material.dart';
import '../services/runtime_config.dart';
import '../theme/app_theme.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _formKey = GlobalKey<FormState>();
  final _baseUrlController = TextEditingController();
  final _portController = TextEditingController();
  final _config = RuntimeConfig();

  bool _isLoading = true;
  bool _hasCustomConfig = false;

  @override
  void initState() {
    super.initState();
    _loadCurrentConfig();
  }

  @override
  void dispose() {
    _baseUrlController.dispose();
    _portController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentConfig() async {
    setState(() => _isLoading = true);

    final baseUrl = await _config.getBaseUrl();
    final port = await _config.getPort();
    final hasCustom = await _config.hasCustomConfig();

    _baseUrlController.text = baseUrl;
    _portController.text = port;

    setState(() {
      _hasCustomConfig = hasCustom;
      _isLoading = false;
    });
  }

  Future<void> _saveConfig() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await _config.setBaseUrl(_baseUrlController.text.trim());
      await _config.setPort(_portController.text.trim());
      _config.clearCache();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Server configuration saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        setState(() => _hasCustomConfig = true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save configuration: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _resetToDefaults() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset to Defaults'),
        content: const Text(
          'Are you sure you want to reset the server configuration to default values from .env?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    try {
      await _config.resetToDefaults();
      await _loadCurrentConfig();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Configuration reset to defaults'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to reset configuration: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String? _validateUrl(String? value) {
    if (value == null || value.isEmpty) {
      return 'Base URL is required';
    }

    // Basic URL validation
    final urlPattern = RegExp(r'^https?://[^\s]+$');
    if (!urlPattern.hasMatch(value)) {
      return 'Invalid URL format (must start with http:// or https://)';
    }

    return null;
  }

  String? _validatePort(String? value) {
    if (value == null || value.isEmpty) {
      return 'Port is required';
    }

    final port = int.tryParse(value);
    if (port == null || port < 1 || port > 65535) {
      return 'Port must be between 1 and 65535';
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Server Settings'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Info card
                    Card(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              color: AppTheme.primaryColor,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Configure the network location of your AREA application server. Changes take effect immediately.',
                                style: theme.textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Base URL field
                    Text(
                      'Base URL',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _baseUrlController,
                      decoration: InputDecoration(
                        hintText: 'http://10.84.107.120',
                        prefixIcon: const Icon(Icons.link),
                        helperText:
                            'Server base URL (e.g., http://192.168.1.100)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      keyboardType: TextInputType.url,
                      validator: _validateUrl,
                    ),

                    const SizedBox(height: 24),

                    // Port field
                    Text(
                      'Port',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _portController,
                      decoration: InputDecoration(
                        hintText: '8080',
                        prefixIcon: const Icon(Icons.settings_ethernet),
                        helperText: 'Server port (1-65535)',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      keyboardType: TextInputType.number,
                      validator: _validatePort,
                    ),

                    const SizedBox(height: 24),

                    // Default values info
                    if (_hasCustomConfig)
                      Card(
                        color: Colors.orange.withOpacity(0.1),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              const Icon(Icons.settings, color: Colors.orange),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Using custom configuration',
                                      style:
                                          theme.textTheme.bodyMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Default: ${_config.getDefaultBaseUrl()}:${_config.getDefaultPort()}',
                                      style: theme.textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    const SizedBox(height: 32),

                    // Save button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saveConfig,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Save Configuration'),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Reset button
                    if (_hasCustomConfig)
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: _resetToDefaults,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('Reset to Defaults'),
                        ),
                      ),

                    const SizedBox(height: 32),

                    // Additional info
                    Text(
                      'Network Requirements',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildInfoRow(
                              Icons.wifi,
                              'Same Network',
                              'Your device must be on the same network as the server',
                            ),
                            const Divider(height: 24),
                            _buildInfoRow(
                              Icons.vpn_lock,
                              'Firewall',
                              'Ensure the server port is not blocked by firewall',
                            ),
                            const Divider(height: 24),
                            _buildInfoRow(
                              Icons.security,
                              'Android Security',
                              'HTTP connections to local IPs are allowed for development',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildInfoRow(IconData icon, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.primaryColor),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
