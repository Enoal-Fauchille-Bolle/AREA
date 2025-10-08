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
        Uri.parse('$baseUrl:$port/components/service/$serviceId/actions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body);
      }
      throw Exception('Failed to load actions: ${response.statusCode}');
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
        Uri.parse('$baseUrl:$port/components/service/$serviceId/reactions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body);
      }
      throw Exception('Failed to load reactions: ${response.statusCode}');
    } catch (e) {
      print('Fetch reactions error: $e');
      rethrow;
    }
  }

  // Get all components (actions and reactions) for a service
  Future<List<Map<String, dynamic>>> fetchServiceComponents(
      String serviceId) async {
    try {
      print('Fetching components for service ID: $serviceId');
      final headers = await _authService.getAuthHeaders();
      final url = '$baseUrl:$port/components/service/$serviceId';
      print('Request URL: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      print('Fetch components response status: ${response.statusCode}');
      print('Fetch components response body: ${response.body}');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        print('Decoded body type: ${body.runtimeType}');
        // The endpoint returns an array directly
        final components = _extractList(body);
        print('Extracted ${components.length} components');
        for (var component in components) {
          print('Component: ${jsonEncode(component)}');
        }
        return components;
      }
      throw Exception('Failed to load components: ${response.statusCode}');
    } catch (e) {
      print('Fetch components error: $e');
      rethrow;
    }
  }

  // Get variables/parameters for a component
  Future<List<Map<String, dynamic>>> fetchComponentVariables(
      int componentId) async {
    try {
      print('Fetching variables for component ID: $componentId');
      final headers = await _authService.getAuthHeaders();
      final url = '$baseUrl:$port/variables/component/$componentId';
      print('Request URL: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      print('Fetch variables response status: ${response.statusCode}');
      print('Fetch variables response body: ${response.body}');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final variables = _extractList(body);
        print('Extracted ${variables.length} variables');
        return variables;
      }
      throw Exception('Failed to load variables: ${response.statusCode}');
    } catch (e) {
      print('Fetch variables error: $e');
      rethrow;
    }
  }

  // Get services linked to the authenticated user
  Future<List<Map<String, dynamic>>> fetchUserServices() async {
    try {
      // Get the current user's data to extract the user ID
      final userData = await _authService.getUserData();
      if (userData == null) {
        throw Exception('User not authenticated');
      }

      final userId = userData['id'];
      if (userId == null) {
        throw Exception('User ID not found');
      }

      print('Fetching user services for user ID: $userId');
      final headers = await _authService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl:$port/user-services/user/$userId'),
        headers: headers,
      );

      print('Fetch user services response status: ${response.statusCode}');
      print('Fetch user services response body: ${response.body}');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        // The endpoint returns an array directly, not wrapped in an object
        final userServices = _extractList(body);
        print('Fetched ${userServices.length} user services');

        // Print each user service for debugging
        for (var us in userServices) {
          print('User service: ${jsonEncode(us)}');
        }

        return userServices;
      }
      throw Exception('Failed to load user services: ${response.statusCode}');
    } catch (e) {
      print('Fetch user services error: $e');
      rethrow;
    }
  }

  // Link a service to the authenticated user
  Future<bool> linkService(String serviceId, {String? code}) async {
    try {
      // Get the current user's data to extract the user ID
      final userData = await _authService.getUserData();
      if (userData == null) {
        throw Exception('User not authenticated');
      }

      final userId = userData['id'];
      if (userId == null) {
        throw Exception('User ID not found');
      }

      print('Linking service $serviceId for user $userId');
      final headers = await _authService.getAuthHeaders();

      // Create the user-service link
      final body = {
        'user_id': userId,
        'service_id': int.parse(serviceId),
        'oauth_token': code ?? '', // Use empty string if no code provided
      };

      print('Link service request body: ${jsonEncode(body)}');
      final response = await http.post(
        Uri.parse('$baseUrl:$port/user-services'),
        headers: headers,
        body: jsonEncode(body),
      );

      print('Link service response status: ${response.statusCode}');
      print('Link service response body: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        return true;
      }

      print('Link service failed with status: ${response.statusCode}');
      print('Response body: ${response.body}');
      return false;
    } catch (e) {
      print('Link service error: $e');
      return false;
    }
  }

  // Unlink a service from the authenticated user
  Future<bool> unlinkService(String serviceId) async {
    try {
      // Get the current user's data to extract the user ID
      final userData = await _authService.getUserData();
      if (userData == null) {
        throw Exception('User not authenticated');
      }

      final userId = userData['id'];
      if (userId == null) {
        throw Exception('User ID not found');
      }

      final headers = await _authService.getAuthHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl:$port/user-services/connection/$userId/$serviceId'),
        headers: headers,
      );

      if (response.statusCode == 204 || response.statusCode == 200) {
        return true;
      }

      print('Unlink service failed with status: ${response.statusCode}');
      print('Response body: ${response.body}');
      return false;
    } catch (e) {
      print('Unlink service error: $e');
      return false;
    }
  }
}
