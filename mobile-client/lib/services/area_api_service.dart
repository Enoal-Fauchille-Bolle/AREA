import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class AreaApiService {
  final String baseUrl = 'http://10.84.107.120:3000';
  final AuthService _authService = AuthService();

  // Fetch all areas
  Future<List<Map<String, dynamic>>> fetchAreas() async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/areas'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data.containsKey('areas')) {
          final List areas = data['areas'];
          return areas.cast<Map<String, dynamic>>();
        } else if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
        throw Exception('Unexpected response format');
      }
      throw Exception('Failed to load AREAs: ${response.statusCode}');
    } catch (e) {
      print('Fetch areas error: $e');
      rethrow;
    }
  }

  // Fetch a specific area by ID
  Future<Map<String, dynamic>> fetchAreaById(String id) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/areas/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception('Failed to load AREA with ID $id');
    } catch (e) {
      print('Fetch area error: $e');
      rethrow;
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

  // Update an area by ID
  Future<Map<String, dynamic>> updateArea({
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

      final response = await http.patch(
        Uri.parse('$baseUrl/areas/$id'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
          'Failed to update AREA with ID $id: ${response.statusCode}');
    } catch (e) {
      print('Update area error: $e');
      rethrow;
    }
  }

  // Delete an area by ID
  Future<void> deleteArea(String id) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/areas/$id'),
        headers: headers,
      );

      if (response.statusCode != 204) {
        throw Exception(
            'Failed to delete AREA with ID $id: ${response.statusCode}');
      }
    } catch (e) {
      print('Delete area error: $e');
      rethrow;
    }
  }
}
