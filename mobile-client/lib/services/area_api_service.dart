import 'dart:convert';
import 'package:http/http.dart' as http;

class AreaApiService {
  final String baseUrl = 'http://10.84.107.120:3000';

  Future<List<Map<String, dynamic>>> fetchAreas() async {
    final response = await http.get(Uri.parse('$baseUrl/areas'));
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.cast<Map<String, dynamic>>();
    }
    throw Exception('Failed to load AREAs');
  }

  Future<Map<String, dynamic>> createArea(
      String action, String reaction) async {
    final response = await http.post(
      Uri.parse('$baseUrl/areas'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'action': action, 'reaction': reaction}),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to create AREA');
  }

  Future<void> deleteArea(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/areas/$id'));
    if (response.statusCode != 204) {
      throw Exception('Failed to delete AREA');
    }
  }

  Future<Map<String, dynamic>> editArea(
      int id, String action, String reaction) async {
    final response = await http.put(
      Uri.parse('$baseUrl/areas/$id'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'action': action, 'reaction': reaction}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to edit AREA');
  }
}
