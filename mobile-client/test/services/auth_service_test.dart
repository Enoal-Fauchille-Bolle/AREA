import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile_client/services/auth_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AuthService', () {
    late AuthService authService;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      dotenv.testLoad(fileInput: '''
URL_BASE=http://localhost
PORT=8080
''');

      authService = AuthService();
    });

    group('Token Management', () {
      test('should return null when no token is stored', () async {
        final token = await authService.getToken();
        expect(token, isNull);
      });

      test('should retrieve token after storage', () async {
        // Manually store a token to test retrieval
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', 'test_token_123');

        final retrievedToken = await authService.getToken();
        expect(retrievedToken, equals('test_token_123'));
      });
    });

    group('User Data Management', () {
      test('should return null when no user data is stored', () async {
        final userData = await authService.getUserData();
        expect(userData, isNull);
      });

      test('should retrieve user data after storage', () async {
        // Manually store user data to test retrieval
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(
            'user_data', '{"id": 1, "email": "test@test.com"}');

        final retrieved = await authService.getUserData();
        expect(retrieved, isNotNull);
        expect(retrieved!['id'], equals(1));
        expect(retrieved['email'], equals('test@test.com'));
      });
    });

    group('isLoggedIn', () {
      test('should return false when no token exists', () async {
        final result = await authService.isLoggedIn();
        expect(result, isFalse);
      });

      test('should return true when token exists', () async {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', 'test_token');

        final result = await authService.isLoggedIn();
        expect(result, isTrue);
      });
    });

    group('logout', () {
      test('should clear token on logout', () async {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', 'test_token');

        await authService.logout();

        final token = prefs.getString('jwt_token');
        expect(token, isNull);
      });

      test('should clear user data on logout', () async {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_data', '{"id": 1}');

        await authService.logout();

        final userData = prefs.getString('user_data');
        expect(userData, isNull);
      });

      test('should work even when no data is stored', () async {
        await authService.logout();
        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('jwt_token'), isNull);
        expect(prefs.getString('user_data'), isNull);
      });
    });

    group('getAuthHeaders', () {
      test('should return headers without Authorization when not logged in',
          () async {
        final headers = await authService.getAuthHeaders();

        expect(headers.containsKey('Authorization'), isFalse);
        expect(headers['Content-Type'], equals('application/json'));
      });

      test('should return headers with Authorization when logged in', () async {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', 'test_token_123');

        final headers = await authService.getAuthHeaders();

        expect(headers['Authorization'], equals('Bearer test_token_123'));
        expect(headers['Content-Type'], equals('application/json'));
      });

      test('should always include Content-Type header', () async {
        // Without token
        final headersLoggedOut = await authService.getAuthHeaders();
        expect(headersLoggedOut['Content-Type'], equals('application/json'));

        // With token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', 'token');
        final headersLoggedIn = await authService.getAuthHeaders();
        expect(headersLoggedIn['Content-Type'], equals('application/json'));
      });
    });
  });
}
