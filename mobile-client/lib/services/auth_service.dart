import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_logger.dart';
import 'runtime_config.dart';

class AuthService {
  final _config = RuntimeConfig();
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
      final serverUrl = await _config.getServerUrl();
      final response = await http.post(
        Uri.parse('$serverUrl/auth/login'),
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
  Future<bool> loginOAuth2(
      String provider, String code, String redirectUri) async {
    try {
      AppLogger.log(
          'OAuth2 login attempt: provider=$provider, redirectUri=$redirectUri');

      final serverUrl = await _config.getServerUrl();
      final response = await http.post(
        Uri.parse('$serverUrl/auth/login-oauth2'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'provider': provider,
          'code': code,
          'redirect_uri': redirectUri,
        }),
      );

      AppLogger.log(
          'OAuth2 login response: statusCode=${response.statusCode}, body=${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);
        await fetchUserProfile();
        return true;
      }
      AppLogger.error(
          'OAuth2 login failed with status code: ${response.statusCode}');
      return false;
    } catch (e) {
      AppLogger.error('OAuth2 login error: $e');
      return false;
    }
  }

  // Register new user
  Future<bool> register(String email, String username, String password) async {
    try {
      final serverUrl = await _config.getServerUrl();
      final response = await http.post(
        Uri.parse('$serverUrl/auth/register'),
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
  Future<bool> registerOAuth2(
      String provider, String code, String redirectUri) async {
    try {
      AppLogger.log(
          'OAuth2 register attempt: provider=$provider, redirectUri=$redirectUri');

      final serverUrl = await _config.getServerUrl();
      final response = await http.post(
        Uri.parse('$serverUrl/auth/register-oauth2'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'provider': provider,
          'code': code,
          'redirect_uri': redirectUri,
        }),
      );

      AppLogger.log(
          'OAuth2 register response: statusCode=${response.statusCode}, body=${response.body}');

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);
        await fetchUserProfile();
        return true;
      }
      AppLogger.error(
          'OAuth2 register failed with status code: ${response.statusCode}');
      return false;
    } catch (e) {
      AppLogger.error('OAuth2 register error: $e');
      return false;
    }
  }

  // Fetch user profile
  Future<void> fetchUserProfile() async {
    try {
      final token = await getToken();
      if (token == null) return;

      final serverUrl = await _config.getServerUrl();
      final response = await http.get(
        Uri.parse('$serverUrl/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        await _saveUserData(userData);
      }
    } catch (e) {
      AppLogger.error('Fetch profile error: $e');
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

      final serverUrl = await _config.getServerUrl();
      final response = await http.patch(
        Uri.parse('$serverUrl/auth/me'),
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

      final serverUrl = await _config.getServerUrl();
      final response = await http.delete(
        Uri.parse('$serverUrl/auth/me'),
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

  // Verify email with 2FA code
  Future<Map<String, dynamic>> verifyEmail(String email, String code) async {
    try {
      final serverUrl = await _config.getServerUrl();
      final response = await http.post(
        Uri.parse('$serverUrl/auth/verify-email'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'code': code,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'message': data['message']};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Verification failed'
        };
      }
    } catch (e) {
      AppLogger.error('Verify email error: $e');
      return {'success': false, 'message': 'Verification error: $e'};
    }
  }

  // Resend verification code
  Future<Map<String, dynamic>> resendVerificationCode(String email) async {
    try {
      final serverUrl = await _config.getServerUrl();
      final response = await http.post(
        Uri.parse('$serverUrl/auth/resend-verification'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'message': data['message']};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to resend code'
        };
      }
    } catch (e) {
      AppLogger.error('Resend verification error: $e');
      return {'success': false, 'message': 'Resend error: $e'};
    }
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
