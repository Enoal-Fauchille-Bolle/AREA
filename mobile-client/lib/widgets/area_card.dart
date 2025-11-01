import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Modern card widget for displaying AREA (Action/Reaction) information
class AreaCard extends StatelessWidget {
  final String id;
  final String name;
  final String? description;
  final bool isActive;
  final String? lastTriggeredAt;
  final int triggeredCount;
  final Map<String, dynamic>? action;
  final Map<String, dynamic>? reaction;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onTap;
  final bool showActions;

  const AreaCard({
    super.key,
    required this.id,
    required this.name,
    this.description,
    required this.isActive,
    this.lastTriggeredAt,
    this.triggeredCount = 0,
    this.action,
    this.reaction,
    this.onEdit,
    this.onDelete,
    this.onTap,
    this.showActions = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with title and status
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                name,
                                style: theme.textTheme.titleLarge,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            _buildStatusBadge(context),
                          ],
                        ),
                        if (description != null && description!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            description!,
                            style: theme.textTheme.bodySmall,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (showActions) _buildActionButtons(context),
                ],
              ),

              // Divider
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1),
              ),

              // Action and Reaction info
              Row(
                children: [
                  Expanded(
                    child: _buildComponentInfo(
                      context,
                      'Action',
                      action?['component']?['name'] ?? 'Unknown',
                      Icons.flash_on,
                      AppTheme.accentColor,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 40,
                    color: isDark
                        ? AppTheme.darkDividerColor
                        : AppTheme.dividerColor,
                  ),
                  Expanded(
                    child: _buildComponentInfo(
                      context,
                      'Reaction',
                      reaction?['component']?['name'] ?? 'Unknown',
                      Icons.play_arrow,
                      AppTheme.secondaryColor,
                    ),
                  ),
                ],
              ),

              // Divider
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1),
              ),

              // Stats row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStat(
                    context,
                    Icons.numbers,
                    'Triggered',
                    '$triggeredCount times',
                  ),
                  _buildStat(
                    context,
                    Icons.access_time,
                    'Last Run',
                    _formatLastTriggered(lastTriggeredAt),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isActive
            ? AppTheme.successColor.withValues(alpha: 0.1)
            : AppTheme.textSecondary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive ? AppTheme.successColor : AppTheme.textSecondary,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            isActive ? 'Active' : 'Inactive',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isActive ? AppTheme.successColor : AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (onEdit != null)
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 20),
            onPressed: onEdit,
            tooltip: 'Edit',
            padding: const EdgeInsets.all(8),
            constraints: const BoxConstraints(),
          ),
        if (onDelete != null)
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 20),
            onPressed: onDelete,
            tooltip: 'Delete',
            color: AppTheme.errorColor,
            padding: const EdgeInsets.all(8),
            constraints: const BoxConstraints(),
          ),
      ],
    );
  }

  Widget _buildComponentInfo(
    BuildContext context,
    String label,
    String name,
    IconData icon,
    Color color,
  ) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.labelMedium,
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  name,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStat(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 16, color: theme.textTheme.bodySmall?.color),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall,
            ),
            Text(
              value,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _formatLastTriggered(String? timestamp) {
    if (timestamp == null || timestamp.isEmpty || timestamp == 'Never') {
      return 'Never';
    }

    try {
      final dateTime = DateTime.parse(timestamp);
      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inHours < 1) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inDays < 1) {
        return '${difference.inHours}h ago';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}d ago';
      } else {
        return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
      }
    } catch (e) {
      return timestamp;
    }
  }
}
