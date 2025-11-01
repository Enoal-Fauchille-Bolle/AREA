import 'package:flutter/material.dart';
import '../services/service_api_service.dart';
import '../services/discord_oauth_service.dart';
import '../services/github_oauth_service.dart';
import '../services/gmail_oauth_service.dart';
import '../services/twitch_oauth_service.dart';
import '../services/youtube_oauth_service.dart';
import '../services/spotify_oauth_service.dart';
import '../services/reddit_oauth_service.dart';
import '../widgets/service_card.dart';
import '../utils/app_logger.dart';

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
      // Note: /services/me returns services with 'id' field
      _linkedServiceIds = userServices
          .map((s) => s['id']?.toString() ?? '')
          .where((id) => id.isNotEmpty)
          .toSet();

      AppLogger.log('Loaded ${services.length} services');
      AppLogger.log('Linked service IDs: $_linkedServiceIds');

      return services;
    } catch (e) {
      AppLogger.error('Error loading services: $e');
      rethrow;
    }
  }

  Future<void> _handleLinkToggle(
      String serviceId, bool isLinked, String serviceName) async {
    try {
      AppLogger.log(
          '_handleLinkToggle called: serviceId=$serviceId, isLinked=$isLinked, serviceName=$serviceName');
      bool success;
      if (isLinked) {
        success = await _serviceApi.unlinkService(serviceId);
        if (success) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Service unlinked successfully')),
            );
          }
          // Reload services to update the UI
          await _loadServices();
        }
      } else {
        // Handle OAuth flow for Discord, GitHub, Gmail, Twitch, YouTube, Spotify, and Reddit
        AppLogger.log('Checking service type: ${serviceName.toLowerCase()}');
        final serviceNameLower = serviceName.toLowerCase();

        if (serviceNameLower == 'discord' ||
            serviceNameLower == 'github' ||
            serviceNameLower == 'gmail' ||
            serviceNameLower == 'twitch' ||
            serviceNameLower == 'youtube' ||
            serviceNameLower == 'spotify' ||
            serviceNameLower == 'reddit') {
          AppLogger.log('Service is $serviceName, starting OAuth flow...');
          if (mounted) {
            String? code;

            // Open appropriate OAuth flow
            if (serviceNameLower == 'discord') {
              code = await DiscordOAuthService.authorize(context,
                  forService: true);
            } else if (serviceNameLower == 'github') {
              code =
                  await GithubOAuthService.authorize(context, forService: true);
            } else if (serviceNameLower == 'gmail') {
              code =
                  await GmailOAuthService.authorize(context, forService: true);
            } else if (serviceNameLower == 'twitch') {
              code =
                  await TwitchOAuthService.authorize(context, forService: true);
            } else if (serviceNameLower == 'youtube') {
              code = await YoutubeOAuthService.authorize(context,
                  forService: true);
            } else if (serviceNameLower == 'spotify') {
              code = await SpotifyOAuthService.authorize(context,
                  forService: true);
            } else if (serviceNameLower == 'reddit') {
              code =
                  await RedditOAuthService.authorize(context, forService: true);
            }

            AppLogger.log(
                '$serviceName OAuth returned code: ${code != null ? "YES (length: ${code.length})" : "NULL"}');

            if (code == null) {
              // User cancelled or error occurred
              AppLogger.log('$serviceName OAuth cancelled or failed');
              return;
            }

            AppLogger.log(
                'Got $serviceName authorization code, linking service...');

            // Link service with the authorization code
            success = await _serviceApi.linkService(serviceId, code: code);
          } else {
            AppLogger.log('Widget not mounted, aborting');
            return;
          }
        } else {
          // For non-OAuth services, use simple linking
          AppLogger.log('Service is not OAuth-based, using simple linking');
          success = await _serviceApi.linkService(serviceId);
        }

        if (success) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Service linked successfully'),
                backgroundColor: Colors.green,
              ),
            );
          }
          // Reload services to update the UI
          await _loadServices();
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
      AppLogger.error('Link toggle error: $e');
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
                    style: Theme.of(context).textTheme.bodyMedium,
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
                  Icon(
                    Icons.apps,
                    size: 64,
                    color: Theme.of(context).colorScheme.secondary,
                  ),
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
                              service['name'] ?? 'Unknown',
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
                            service['name'] ?? 'Unknown',
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
