import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AreaApiService {
  final String baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
  final String port = dotenv.env['PORT'] ?? '3000';

  Future<List<Map<String, dynamic>>> fetchAreas() async {
    final response = await http.get(Uri.parse('$baseUrl:$port/areas'));
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.cast<Map<String, dynamic>>();
    }
    throw Exception('Failed to load AREAs');
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
      Uri.parse('$baseUrl:$port/areas/$id'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'action': action, 'reaction': reaction}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to edit AREA');
  }
}
