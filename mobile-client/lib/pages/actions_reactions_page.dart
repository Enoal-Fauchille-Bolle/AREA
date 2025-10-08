import 'package:flutter/material.dart';
import '../services/area_api_service.dart';
import 'create_action_reaction_page.dart';
import 'edit_action_reaction_page.dart';

class ActionsReactionsPage extends StatefulWidget {
  final bool guestMode;
  const ActionsReactionsPage({super.key, this.guestMode = false});

  @override
  State<ActionsReactionsPage> createState() => _ActionsReactionsPageState();
}

class _ActionsReactionsPageState extends State<ActionsReactionsPage> {
  final api = AreaApiService();

  late Future<List<Map<String, dynamic>>> _areasFuture;

  @override
  void initState() {
    super.initState();
    print('ActionsReactionsPage: initState - loading areas');
    _areasFuture = api.fetchAreas();
  }

  void _refreshAreas() {
    print('ActionsReactionsPage: refreshing areas');
    setState(() {
      _areasFuture = api.fetchAreas();
    });
  }

  Future<void> _handleCreate() async {
    print('ActionsReactionsPage: navigating to create page');
    final result = await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CreateActionReactionPage()),
    );
    print(
        'ActionsReactionsPage: returned from create page with result: $result');
    _refreshAreas();
  }

  Future<void> _handleDelete(String id) async {
    // Show confirmation dialog
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete AREA'),
        content: const Text('Are you sure you want to delete this AREA?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await api.deleteArea(id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('AREA deleted successfully')),
          );
          _refreshAreas();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error deleting AREA: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Actions & Reactions')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _areasFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final areas = snapshot.data ?? [];
          if (areas.isEmpty) {
            return const Center(child: Text('No AREAs found.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: areas.length,
            itemBuilder: (context, index) {
              final area = areas[index];
              return Card(
                child: ListTile(
                  title: Text(area['name'] ?? 'Unnamed Area'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                          'Description: ${area['description'] ?? 'No description'}'),
                      Text(
                          'Active: ${area['is_active'] ?? false ? "Yes" : "No"}'),
                      Text(
                          'Last Triggered: ${area['last_triggered_at'] ?? "Never"}'),
                      Text('Triggered Count: ${area['triggered_count'] ?? 0}'),
                    ],
                  ),
                  trailing: widget.guestMode
                      ? null
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit),
                              onPressed: () {
                                Navigator.of(context)
                                    .push(
                                      MaterialPageRoute(
                                        builder: (_) => EditActionReactionPage(
                                          areaId: area['id'].toString(),
                                          initialAction: area['name'] ?? '',
                                          initialReaction:
                                              '', // Adjust if needed
                                        ),
                                      ),
                                    )
                                    .then((_) => _refreshAreas());
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete),
                              onPressed: () =>
                                  _handleDelete(area['id'].toString()),
                            ),
                          ],
                        ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: widget.guestMode
          ? null
          : FloatingActionButton(
              onPressed: _handleCreate,
              tooltip: 'Add Action/Reaction',
              child: const Icon(Icons.add),
            ),
    );
  }
}
