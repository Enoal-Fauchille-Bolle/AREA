import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ServiceCard extends StatelessWidget {
  final String name;
  final String description;
  final String? iconUrl;
  final bool isLinked;
  final bool isActive;
  final VoidCallback? onTap;
  final VoidCallback? onLinkToggle;

  const ServiceCard({
    super.key,
    required this.name,
    required this.description,
    this.iconUrl,
    this.isLinked = false,
    this.isActive = true,
    this.onTap,
    this.onLinkToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Service icon
              if (iconUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    iconUrl!,
                    width: 48,
                    height: 48,
                    errorBuilder: (_, __, ___) => _buildDefaultIcon(),
                  ),
                )
              else
                _buildDefaultIcon(),
              const SizedBox(width: 16),

              // Service info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (!isActive)
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: Text(
                          'Inactive',
                          style: TextStyle(
                            color: AppTheme.errorColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // Link/Unlink button
              if (onLinkToggle != null)
                IconButton(
                  icon: Icon(
                    isLinked ? Icons.link_off : Icons.link,
                    color: isLinked
                        ? AppTheme.errorColor
                        : Theme.of(context).colorScheme.primary,
                  ),
                  tooltip: isLinked ? 'Unlink' : 'Link',
                  onPressed: onLinkToggle,
                ),

              // Status indicator
              if (isLinked)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Linked',
                    style: TextStyle(
                      color: AppTheme.successColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDefaultIcon() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(
        Icons.apps,
        color: AppTheme.primaryColor,
        size: 28,
      ),
    );
  }
}
