import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_service.dart';

class AreaApiService {
  final String baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
  final String port = dotenv.env['PORT'] ?? '3000';
  final AuthService _authService = AuthService();

  // Fetch all areas
  Future<List<Map<String, dynamic>>> fetchAreas() async {
    final response = await http.get(Uri.parse('$baseUrl:$port/areas'));
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.cast<Map<String, dynamic>>();
    } else {
      throw Exception('Failed to fetch areas: ${response.statusCode}');
    }
  }

  Future<Map<String, dynamic>> createSimpleArea(
      String action, String reaction) async {
    final response = await http.post(
      Uri.parse('$baseUrl:$port/areas'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'action': action, 'reaction': reaction}),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create area: ${response.statusCode}');
    }
  }

  // Create a new area
  Future<Map<String, dynamic>> createArea({
    required String name,
    String? description,
    required List<Map<String, dynamic>> components,
    bool isActive = true,
  }) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/areas'),
        headers: headers,
        body: jsonEncode({
          'name': name,
          'description': description,
          'components': components,
          'is_active': isActive,
        }),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      throw Exception('Failed to create AREA: ${response.statusCode}');
    } catch (e) {
      print('Create area error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> editArea(
      int id, String action, String reaction) async {
    final response = await http.put(
      Uri.parse('$baseUrl:$port/areas/$id'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'action': action, 'reaction': reaction}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to edit area: ${response.statusCode}');
    }
  }

  // Update an existing area
  Future<void> updateArea({
    required String id,
    String? name,
    String? description,
    List<Map<String, dynamic>>? components,
    bool? isActive,
  }) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (description != null) body['description'] = description;
      if (components != null) body['components'] = components;
      if (isActive != null) body['is_active'] = isActive;

      final response = await http.put(
        Uri.parse('$baseUrl:$port/areas/$id'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode != 204) {
        throw Exception('Failed to update area: ${response.statusCode}');
      }
    } catch (e) {
      print('Update area error: $e');
      rethrow;
    }
  }

  // Delete an area
  Future<void> deleteArea(String id) async {
    final response = await http.delete(Uri.parse('$baseUrl:$port/areas/$id'));
    if (response.statusCode != 204) {
      throw Exception('Failed to delete area: ${response.statusCode}');
    }
  }
}
