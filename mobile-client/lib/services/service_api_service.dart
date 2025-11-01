import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';
import '../utils/app_logger.dart';
import 'runtime_config.dart';

class ServiceApiService {
  final _config = RuntimeConfig();
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
      final serverUrl = await _config.getServerUrl();
      final response = await http.get(
        Uri.parse('$serverUrl/services'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body, key: 'services');
      }
      throw Exception('Failed to load services');
    } catch (e) {
      AppLogger.error('Fetch services error: $e');
      rethrow;
    }
  }

  // Get a specific service by ID
  Future<Map<String, dynamic>> fetchServiceById(String id) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final serverUrl = await _config.getServerUrl();
      final response = await http.get(
        Uri.parse('$serverUrl/services/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body is Map<String, dynamic>) return body;
      }
      throw Exception('Failed to load service with ID $id');
    } catch (e) {
      AppLogger.error('Fetch service error: $e');
      rethrow;
    }
  }

  // Get available actions for a service
  Future<List<Map<String, dynamic>>> fetchServiceActions(
      String serviceId) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final serverUrl = await _config.getServerUrl();
      final response = await http.get(
        Uri.parse('$serverUrl/components/service/$serviceId/actions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body);
      }
      throw Exception('Failed to load actions: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Fetch actions error: $e');
      rethrow;
    }
  }

  // Get available reactions for a service
  Future<List<Map<String, dynamic>>> fetchServiceReactions(
      String serviceId) async {
    try {
      final headers = await _authService.getAuthHeaders();
      final serverUrl = await _config.getServerUrl();
      final response = await http.get(
        Uri.parse('$serverUrl/components/service/$serviceId/reactions'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return _extractList(body);
      }
      throw Exception('Failed to load reactions: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Fetch reactions error: $e');
      rethrow;
    }
  }

  // Get all components (actions and reactions) for a service
  Future<List<Map<String, dynamic>>> fetchServiceComponents(
      String serviceId) async {
    try {
      AppLogger.log('Fetching components for service ID: $serviceId');
      final headers = await _authService.getAuthHeaders();
      final serverUrl = await _config.getServerUrl();
      final url = '$serverUrl/components/service/$serviceId';
      AppLogger.log('Request URL: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      AppLogger.log('Fetch components response status: ${response.statusCode}');
      AppLogger.log('Fetch components response body: ${response.body}');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        AppLogger.log('Decoded body type: ${body.runtimeType}');
        // The endpoint returns an array directly
        final components = _extractList(body);
        AppLogger.log('Extracted ${components.length} components');
        for (var component in components) {
          AppLogger.log('Component: ${jsonEncode(component)}');
        }
        return components;
      }
      throw Exception('Failed to load components: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Fetch components error: $e');
      rethrow;
    }
  }

  // Get variables/parameters for a component
  Future<List<Map<String, dynamic>>> fetchComponentVariables(
      int componentId) async {
    try {
      AppLogger.log('Fetching variables for component ID: $componentId');
      final headers = await _authService.getAuthHeaders();
      final serverUrl = await _config.getServerUrl();
      final url = '$serverUrl/variables/component/$componentId';
      AppLogger.log('Request URL: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      AppLogger.log('Fetch variables response status: ${response.statusCode}');
      AppLogger.log('Fetch variables response body: ${response.body}');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final variables = _extractList(body);
        AppLogger.log('Extracted ${variables.length} variables');

        // Log each variable to check for duplicates
        for (var i = 0; i < variables.length; i++) {
          AppLogger.log(
              'Variable $i: id=${variables[i]['id']}, name=${variables[i]['name']}, kind=${variables[i]['kind']}');
        }

        return variables;
      }
      throw Exception('Failed to load variables: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Fetch variables error: $e');
      rethrow;
    }
  }

  // Get services linked to the authenticated user
  Future<List<Map<String, dynamic>>> fetchUserServices() async {
    try {
      AppLogger.log('Fetching user services');
      final headers = await _authService.getAuthHeaders();
      final serverUrl = await _config.getServerUrl();
      final response = await http.get(
        Uri.parse('$serverUrl/services/me'),
        headers: headers,
      );

      AppLogger.log(
          'Fetch user services response status: ${response.statusCode}');
      AppLogger.log('Fetch user services response body: ${response.body}');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        // The endpoint returns services array, possibly wrapped
        final userServices = _extractList(body, key: 'services');
        AppLogger.log('Fetched ${userServices.length} user services');

        // Print each user service for debugging
        for (var us in userServices) {
          AppLogger.log('User service: ${jsonEncode(us)}');
        }

        return userServices;
      }
      throw Exception('Failed to load user services: ${response.statusCode}');
    } catch (e) {
      AppLogger.error('Fetch user services error: $e');
      rethrow;
    }
  }

  // Link a service to the authenticated user
  Future<bool> linkService(String serviceId, {String? code}) async {
    try {
      AppLogger.log('Linking service $serviceId');
      final headers = await _authService.getAuthHeaders();
      headers['Content-Type'] = 'application/json'; // Add Content-Type header

      // Prepare request body
      final Map<String, dynamic> body = {};
      if (code != null) {
        body['code'] = code;
        body['platform'] = 'mobile';
      }

      AppLogger.log('Link service request body: ${jsonEncode(body)}');
      final serverUrl = await _config.getServerUrl();
      final response = await http.post(
        Uri.parse('$serverUrl/services/$serviceId/link'),
        headers: headers,
        body: jsonEncode(body), // Always send JSON body, even if empty
      );

      AppLogger.log('Link service response status: ${response.statusCode}');
      if (response.body.isNotEmpty) {
        AppLogger.log('Link service response body: ${response.body}');
      }

      if (response.statusCode == 204 || response.statusCode == 200) {
        return true;
      }

      AppLogger.log('Link service failed with status: ${response.statusCode}');
      if (response.body.isNotEmpty) {
        AppLogger.log('Response body: ${response.body}');
      }
      return false;
    } catch (e) {
      AppLogger.error('Link service error: $e');
      return false;
    }
  }

  // Unlink a service from the authenticated user
  Future<bool> unlinkService(String serviceId) async {
    try {
      AppLogger.log('Unlinking service $serviceId');
      final headers = await _authService.getAuthHeaders();
      final serverUrl = await _config.getServerUrl();
      final response = await http.delete(
        Uri.parse('$serverUrl/services/$serviceId/unlink'),
        headers: headers,
      );

      AppLogger.log('Unlink service response status: ${response.statusCode}');
      if (response.body.isNotEmpty) {
        AppLogger.log('Unlink service response body: ${response.body}');
      }

      if (response.statusCode == 204 || response.statusCode == 200) {
        return true;
      }

      AppLogger.log(
          'Unlink service failed with status: ${response.statusCode}');
      if (response.body.isNotEmpty) {
        AppLogger.log('Response body: ${response.body}');
      }
      return false;
    } catch (e) {
      AppLogger.error('Unlink service error: $e');
      return false;
    }
  }
}
