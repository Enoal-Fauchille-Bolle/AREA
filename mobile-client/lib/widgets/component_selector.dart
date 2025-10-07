import 'package:flutter/material.dart';

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
      value: _selectedComponent,
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
                      width: 24,
                      height: 24,
                      errorBuilder: (_, __, ___) =>
                          const Icon(Icons.apps, size: 24),
                    ),
                  ),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      component['name'] ?? 'Unnamed',
                      style: const TextStyle(fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (component['description'] != null)
                      Text(
                        component['description'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                  ],
                ),
              ),
              // Type badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: component['type'] == 'action'
                      ? Colors.blue[100]
                      : Colors.green[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  component['type']?.toString().toUpperCase() ?? '',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: component['type'] == 'action'
                        ? Colors.blue[700]
                        : Colors.green[700],
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
