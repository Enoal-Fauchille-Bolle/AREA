import 'package:flutter/material.dart';

class DeleteActionReactionPage extends StatelessWidget {
  const DeleteActionReactionPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Delete Action/Reaction')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Select an action/reaction to delete:'),
            const SizedBox(height: 16),
            // TODO: Replace with dynamic list from backend
            ListTile(
              leading: const Icon(Icons.flash_on),
              title: const Text('Action: Receive Email'),
              subtitle: const Text('Reaction: Send Notification'),
              trailing: IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                onPressed: () {
                  // TODO: Delete from backend
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(const SnackBar(content: Text('Deleted!')));
                },
              ),
            ),
            // ...existing code for more actions/reactions
          ],
        ),
      ),
    );
  }
}
