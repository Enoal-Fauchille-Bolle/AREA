import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../utils/app_logger.dart';

class AuthService {
  final String baseUrl = dotenv.env['URL_BASE'] ?? 'http://10.84.107.120';
  final String port = dotenv.env['PORT'] ?? '8080';
  static const String _tokenKey = 'jwt_token';
  static const String _userKey = 'user_data';

  // Get stored JWT token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Store JWT token
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  // Store user data
  Future<void> _saveUserData(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(userData));
  }

  // Get stored user data
  Future<Map<String, dynamic>?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_userKey);
    if (data != null) {
      return jsonDecode(data);
    }
    return null;
  }

  // Login with email and password
  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl:$port/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);

        // Fetch user profile after login
        await fetchUserProfile();
        return true;
      }
      return false;
    } catch (e) {
      AppLogger.error('Login error: $e');
      return false;
    }
  }

  // Login with OAuth2
  Future<bool> loginOAuth2(String service, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl:$port/auth/login-oauth2'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'service': service,
          'code': code,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);
        await fetchUserProfile();
        return true;
      }
      return false;
    } catch (e) {
      AppLogger.error('OAuth2 login error: $e');
      return false;
    }
  }

  // Register new user
  Future<bool> register(String email, String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl:$port/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'username': username,
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);
        await fetchUserProfile();
        return true;
      }
      return false;
    } catch (e) {
      AppLogger.error('Register error: $e');
      return false;
    }
  }

  // Register with OAuth2
  Future<bool> registerOAuth2(String service, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl:$port/auth/register-oauth2'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'service': service,
          'code': code,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);
        await fetchUserProfile();
        return true;
      }
      return false;
    } catch (e) {
      AppLogger.error('OAuth2 register error: $e');
      return false;
    }
  }

  // Fetch user profile
  Future<Map<String, dynamic>?> fetchUserProfile() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl:$port/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        await _saveUserData(userData);
        return userData;
      }
      return null;
    } catch (e) {
      AppLogger.error('Fetch profile error: $e');
      return null;
    }
  }

  // Update user profile
  Future<bool> updateProfile({
    String? email,
    String? username,
    String? password,
    String? iconUrl,
  }) async {
    try {
      final token = await getToken();
      if (token == null) return false;

      final body = <String, dynamic>{};
      if (email != null) body['email'] = email;
      if (username != null) body['username'] = username;
      if (password != null) body['password'] = password;
      if (iconUrl != null) body['icon_url'] = iconUrl;

      final response = await http.patch(
        Uri.parse('$baseUrl:$port/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        await _saveUserData(userData);
        return true;
      }
      return false;
    } catch (e) {
      AppLogger.error('Update profile error: $e');
      return false;
    }
  }

  // Delete account
  Future<bool> deleteAccount() async {
    try {
      final token = await getToken();
      if (token == null) return false;

      final response = await http.delete(
        Uri.parse('$baseUrl:$port/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 204) {
        await logout();
        return true;
      }
      return false;
    } catch (e) {
      AppLogger.error('Delete account error: $e');
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  // Get auth headers for API calls
  Future<Map<String, String>> getAuthHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
