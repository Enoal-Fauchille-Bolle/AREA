import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_service.dart';
import '../utils/app_logger.dart';

class AreaApiService {
  final String baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
  final String port = dotenv.env['PORT'] ?? '8080';
  final AuthService _authService = AuthService();

  // Fetch all areas
  Future<List<Map<String, dynamic>>> fetchAreas() async {
    try {
      final headers = await _authService.getAuthHeaders();
      AppLogger.log('Fetching areas with headers: $headers');

      final response = await http.get(
        Uri.parse('$baseUrl:$port/areas'),
        headers: headers,
      );

      AppLogger.log('Fetch areas response status: ${response.statusCode}');
      AppLogger.log('Fetch areas response body: ${response.body}');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        AppLogger.log('Decoded body type: ${body.runtimeType}');

        // The endpoint might return {areas: [...]} or just [...]
        if (body is List) {
          AppLogger.log('Found ${body.length} areas');
          return body.cast<Map<String, dynamic>>();
        } else if (body is Map && body['areas'] is List) {
          final areas = (body['areas'] as List).cast<Map<String, dynamic>>();
          AppLogger.log('Found ${areas.length} areas in wrapper');
          return areas;
        }
        AppLogger.log('No areas found in response');
        return [];
      }
      throw Exception('Failed to fetch areas: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Fetch areas error: $e');
      rethrow;
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

  // Create a new area with parameters
  Future<Map<String, dynamic>> createAreaWithParameters({
    required String name,
    String? description,
    required int componentActionId,
    required int componentReactionId,
    required Map<String, String> parameters,
    bool isActive = true,
  }) async {
    try {
      final headers = await _authService.getAuthHeaders();
      AppLogger.log('Creating area with parameters: $headers');

      final body = {
        'area': {
          'name': name,
          'description': description,
          'component_action_id': componentActionId,
          'component_reaction_id': componentReactionId,
          'is_active': isActive,
        },
        'parameters': parameters,
      };
      AppLogger.log('Creating area with body: ${jsonEncode(body)}');

      final response = await http.post(
        Uri.parse('$baseUrl:$port/areas/create-with-parameters'),
        headers: headers,
        body: jsonEncode(body),
      );

      AppLogger.log('Create area response status: ${response.statusCode}');
      AppLogger.log('Create area response body: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception('Failed to create AREA: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Create area error: $e');
      rethrow;
    }
  }

  // Create a new area (simple version without parameters)
  Future<Map<String, dynamic>> createArea({
    required String name,
    String? description,
    required int componentActionId,
    required int componentReactionId,
    bool isActive = true,
  }) async {
    try {
      final headers = await _authService.getAuthHeaders();
      AppLogger.log('Creating area with headers: $headers');

      final body = {
        'name': name,
        'description': description,
        'component_action_id': componentActionId,
        'component_reaction_id': componentReactionId,
        'is_active': isActive,
      };
      AppLogger.log('Creating area with body: ${jsonEncode(body)}');

      final response = await http.post(
        Uri.parse('$baseUrl:$port/areas'),
        headers: headers,
        body: jsonEncode(body),
      );

      AppLogger.log('Create area response status: ${response.statusCode}');
      AppLogger.log('Create area response body: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception('Failed to create AREA: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Create area error: $e');
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
      AppLogger.error('Update area error: $e');
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
