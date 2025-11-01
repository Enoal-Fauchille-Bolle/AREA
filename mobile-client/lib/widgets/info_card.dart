import 'package:flutter/material.dart';

/// Info card component - similar to a React/TS Card component
class InfoCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
  final EdgeInsets? margin;
  final EdgeInsets? padding;

  const InfoCard({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
    this.margin = const EdgeInsets.all(16),
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: margin,
      child: Padding(
        padding: padding ?? const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 48, color: iconColor),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
