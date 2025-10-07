import 'package:flutter/material.dart';
import '../services/service_api_service.dart';
import '../widgets/service_card.dart';

class ServicesPage extends StatefulWidget {
  const ServicesPage({super.key});

  @override
  State<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends State<ServicesPage> {
  final ServiceApiService _serviceApi = ServiceApiService();
  late Future<List<Map<String, dynamic>>> _servicesFuture;
  Set<String> _linkedServiceIds = {};

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    setState(() {
      _servicesFuture = _loadAllServices();
    });
  }

  Future<List<Map<String, dynamic>>> _loadAllServices() async {
    try {
      // Load both available services and user's linked services
      final services = await _serviceApi.fetchServices();
      final userServices = await _serviceApi.fetchUserServices();

      // Create a set of linked service IDs
      _linkedServiceIds = userServices.map((s) => s['id'].toString()).toSet();

      return services;
    } catch (e) {
      print('Error loading services: $e');
      rethrow;
    }
  }

  Future<void> _handleLinkToggle(String serviceId, bool isLinked) async {
    try {
      bool success;
      if (isLinked) {
        success = await _serviceApi.unlinkService(serviceId);
        if (success) {
          setState(() {
            _linkedServiceIds.remove(serviceId);
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Service unlinked successfully')),
            );
          }
        }
      } else {
        // For services requiring OAuth2, you would need to handle the OAuth flow here
        success = await _serviceApi.linkService(serviceId);
        if (success) {
          setState(() {
            _linkedServiceIds.add(serviceId);
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Service linked successfully')),
            );
          }
        }
      }

      if (!success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to ${isLinked ? 'unlink' : 'link'} service'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Services'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadServices,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _servicesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading services',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${snapshot.error}',
                    style: TextStyle(color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _loadServices,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final services = snapshot.data ?? [];

          if (services.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.apps, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No services available',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await _loadServices();
            },
            child: ListView(
              children: [
                // Linked services section
                if (_linkedServiceIds.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Linked Services',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                  ...services
                      .where(
                          (s) => _linkedServiceIds.contains(s['id'].toString()))
                      .map((service) => ServiceCard(
                            name: service['name'] ?? 'Unknown',
                            description: service['description'] ?? '',
                            iconUrl: service['icon_url'],
                            isLinked: true,
                            isActive: service['is_active'] ?? true,
                            onLinkToggle: () => _handleLinkToggle(
                              service['id'].toString(),
                              true,
                            ),
                          )),
                  const Divider(height: 32),
                ],

                // Available services section
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Available Services',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                ...services
                    .where(
                        (s) => !_linkedServiceIds.contains(s['id'].toString()))
                    .map((service) => ServiceCard(
                          name: service['name'] ?? 'Unknown',
                          description: service['description'] ?? '',
                          iconUrl: service['icon_url'],
                          isLinked: false,
                          isActive: service['is_active'] ?? true,
                          onLinkToggle: () => _handleLinkToggle(
                            service['id'].toString(),
                            false,
                          ),
                        )),
              ],
            ),
          );
        },
      ),
    );
  }
}
