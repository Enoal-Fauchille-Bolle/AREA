import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ServiceApiService {
  final String baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
  final String port = dotenv.env['PORT'] ?? '3000';
  final AuthService _authService = AuthService();

  // helper to normalize list responses
  List<Map<String, dynamic>> _extractList(dynamic body, {String? key}) {
    if (body == null) return <Map<String, dynamic>>[];
    if (body is List) {
      return body.cast<Map<String, dynamic>>();
    }
    if (body is Map && key != null && body[key] is List) {
      return (body[key] as List).cast<Map<String, dynamic>>();
    }
    return <Map<String, dynamic>>[];
  }

  // Get all available services
  Future<List<Map<String, dynamic>>> fetchServices() async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl:$port/services'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body, key: 'services');
      }
      throw Exception('Failed to load services');
    } catch (e) {
      print('Fetch services error: $e');
      rethrow;
    }
  }

  // Get a specific service by ID
  Future<Map<String, dynamic>> fetchServiceById(String id) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl:$port/services/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body is Map<String, dynamic>) return body;
      }
      throw Exception('Failed to load service with ID $id');
    } catch (e) {
      print('Fetch service error: $e');
      rethrow;
    }
  }

  // Get available actions for a service
  Future<List<Map<String, dynamic>>> fetchServiceActions(
      String serviceId) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl:$port/services/$serviceId/actions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body, key: 'actions');
      }
      throw Exception('Failed to load actions');
    } catch (e) {
      print('Fetch actions error: $e');
      rethrow;
    }
  }

  // Get available reactions for a service
  Future<List<Map<String, dynamic>>> fetchServiceReactions(
      String serviceId) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl:$port/services/$serviceId/reactions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body, key: 'reactions');
      }
      throw Exception('Failed to load reactions');
    } catch (e) {
      print('Fetch reactions error: $e');
      rethrow;
    }
  }

  // Get all components (actions and reactions) for a service
  Future<List<Map<String, dynamic>>> fetchServiceComponents(
      String serviceId) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl:$port/services/$serviceId/components'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body, key: 'components');
      }
      throw Exception('Failed to load components');
    } catch (e) {
      print('Fetch components error: $e');
      rethrow;
    }
  }

  // Get services linked to the authenticated user
  Future<List<Map<String, dynamic>>> fetchUserServices() async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl:$port/services/me'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body, key: 'services');
      }
      throw Exception('Failed to load user services');
    } catch (e) {
      print('Fetch user services error: $e');
      rethrow;
    }
  }

  // Link a service to the authenticated user
  Future<bool> linkService(String serviceId, {String? code}) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final body = code != null ? jsonEncode({'code': code}) : null;

      final response = await http.post(
        Uri.parse('$baseUrl:$port/services/$serviceId/link'),
        headers: headers,
        body: body,
      );

      return response.statusCode == 204 || response.statusCode == 200;
    } catch (e) {
      print('Link service error: $e');
      return false;
    }
  }

  // Unlink a service from the authenticated user
  Future<bool> unlinkService(String serviceId) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl:$port/services/$serviceId/unlink'),
        headers: headers,
      );

      return response.statusCode == 204 || response.statusCode == 200;
    } catch (e) {
      print('Unlink service error: $e');
      return false;
    }
  }
}
