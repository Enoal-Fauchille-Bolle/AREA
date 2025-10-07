import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AreaApiService {
  final String baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
  final String port = dotenv.env['PORT'] ?? '3000';

  // Fetch all areas
  Future<List<Map<String, dynamic>>> fetchAreas() async {
    final response = await http.get(Uri.parse('$baseUrl:$port/areas'));
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.cast<Map<String, dynamic>>();
    }
  }

  Future<Map<String, dynamic>> createArea(
      String action, String reaction) async {
    final response = await http.post(
      Uri.parse('$baseUrl:$port/areas'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'action': action, 'reaction': reaction}),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
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
    }
  }
}
