import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ComponentSelector extends StatefulWidget {
  final String label;
  final String? value;
  final List<Map<String, dynamic>> components;
  final ValueChanged<Map<String, dynamic>?> onChanged;
  final String? Function(Map<String, dynamic>?)? validator;

  const ComponentSelector({
    super.key,
    required this.label,
    required this.components,
    required this.onChanged,
    this.value,
    this.validator,
  });

  @override
  State<ComponentSelector> createState() => _ComponentSelectorState();
}

class _ComponentSelectorState extends State<ComponentSelector> {
  Map<String, dynamic>? _selectedComponent;

  @override
  void initState() {
    super.initState();
    if (widget.value != null) {
      _selectedComponent = widget.components.firstWhere(
        (c) => c['id'] == widget.value,
        orElse: () => {},
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Map<String, dynamic>>(
      decoration: InputDecoration(
        labelText: widget.label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        prefixIcon: const Icon(Icons.layers),
      ),
      initialValue: _selectedComponent,
      menuMaxHeight: 300, // Limit dropdown menu height to prevent overflow
      items: widget.components.map((component) {
        return DropdownMenuItem<Map<String, dynamic>>(
          value: component,
          child: Row(
            children: [
              // Service icon if available
              if (component['service']?['icon_url'] != null)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: Image.network(
                      component['service']['icon_url'],
                      width: 20,
                      height: 20,
                      errorBuilder: (_, __, ___) =>
                          const Icon(Icons.apps, size: 20),
                    ),
                  ),
                ),
              Expanded(
                child: Text(
                  component['name'] ?? 'Unnamed',
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              // Type badge
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: (component['type'] ?? component['kind']) == 'action'
                      ? AppTheme.accentColor.withOpacity(0.1)
                      : AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  (component['type'] ?? component['kind'])
                          ?.toString()
                          .toUpperCase() ??
                      '',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: (component['type'] ?? component['kind']) == 'action'
                        ? AppTheme.accentColor
                        : AppTheme.successColor,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
      onChanged: (value) {
        setState(() {
          _selectedComponent = value;
        });
        widget.onChanged(value);
      },
      validator: (value) {
        if (widget.validator != null) {
          return widget.validator!(value);
        }
        return null;
      },
      isExpanded: true,
    );
  }
}
