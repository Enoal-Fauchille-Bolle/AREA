import { appConfig } from './app.config';

describe('appConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('default values', () => {
    it('should return default configuration when no env vars are set', () => {
      // Clear all relevant env vars
      delete process.env.SERVER_URL;
      delete process.env.PORT;
      delete process.env.NODE_ENV;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.BCRYPT_SALT_ROUNDS;

      const config = appConfig();

      expect(config.serverUrl).toBe('http://127.0.0.1:8080');
      expect(config.port).toBe(8080);
      expect(config.nodeEnv).toBe('development');
      expect(config.jwt.secret).toBe('dev-default-secret-key');
      expect(config.jwt.expiresIn).toBe('24h');
      expect(config.bcryptSaltRounds).toBe(10);
    });

    it('should use default database configuration', () => {
      const config = appConfig();

      expect(config.database.host).toBe('localhost');
      expect(config.database.port).toBe(5432);
      expect(config.database.username).toBe('area_user');
      expect(config.database.password).toBe('area_password');
      expect(config.database.database).toBe('area_db');
      expect(config.database.synchronize).toBe(true);
      expect(config.database.logging).toBe(false);
    });

    it('should use default OAuth2 redirect URIs', () => {
      const config = appConfig();

      expect(config.oauth2.auth.web_redirect_uri).toBe(
        'http://localhost:8081/auth/callback',
      );
      expect(config.oauth2.auth.mobile_redirect_uri).toBe(
        'http://localhost:8080/auth/callback',
      );
      expect(config.oauth2.auth.mobile_scheme).toBe('area://auth/callback');
    });

    it('should use default service redirect URIs', () => {
      const config = appConfig();

      expect(config.oauth2.service.web_redirect_uri).toBe(
        'http://localhost:8081/service/callback',
      );
      expect(config.oauth2.service.mobile_redirect_uri).toBe(
        'http://localhost:8080/service/callback',
      );
      expect(config.oauth2.service.mobile_scheme).toBe(
        'area://service/callback',
      );
    });
  });

  describe('environment variable parsing', () => {
    it('should parse SERVER_URL from environment', () => {
      process.env.SERVER_URL = 'https://example.com:3000';
      const config = appConfig();
      expect(config.serverUrl).toBe('https://example.com:3000');
    });

    it('should parse PORT as integer', () => {
      process.env.PORT = '3000';
      const config = appConfig();
      expect(config.port).toBe(3000);
    });

    it('should parse NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      const config = appConfig();
      expect(config.nodeEnv).toBe('production');
    });

    it('should parse BCRYPT_SALT_ROUNDS as integer', () => {
      process.env.BCRYPT_SALT_ROUNDS = '12';
      const config = appConfig();
      expect(config.bcryptSaltRounds).toBe(12);
    });

    it('should use custom JWT_SECRET', () => {
      process.env.JWT_SECRET = 'custom-secret-key';
      const config = appConfig();
      expect(config.jwt.secret).toBe('custom-secret-key');
    });
  });

  describe('JWT_EXPIRES_IN parsing', () => {
    it('should parse time string format (hours)', () => {
      process.env.JWT_EXPIRES_IN = '48h';
      const config = appConfig();
      expect(config.jwt.expiresIn).toBe('48h');
    });

    it('should parse time string format (days)', () => {
      process.env.JWT_EXPIRES_IN = '7d';
      const config = appConfig();
      expect(config.jwt.expiresIn).toBe('7d');
    });

    it('should parse time string format (minutes)', () => {
      process.env.JWT_EXPIRES_IN = '30m';
      const config = appConfig();
      expect(config.jwt.expiresIn).toBe('30m');
    });

    it('should parse numeric string as seconds', () => {
      process.env.JWT_EXPIRES_IN = '3600';
      const config = appConfig();
      expect(config.jwt.expiresIn).toBe(3600);
    });

    it('should handle time string with space', () => {
      process.env.JWT_EXPIRES_IN = '24 h';
      const config = appConfig();
      expect(config.jwt.expiresIn).toBe('24 h');
    });
  });

  describe('database configuration', () => {
    it('should parse database connection settings', () => {
      process.env.POSTGRES_HOST = 'db.example.com';
      process.env.POSTGRES_PORT = '5433';
      process.env.POSTGRES_USER = 'myuser';
      process.env.POSTGRES_PASSWORD = 'mypassword';
      process.env.POSTGRES_DB = 'mydb';

      const config = appConfig();

      expect(config.database.host).toBe('db.example.com');
      expect(config.database.port).toBe(5433);
      expect(config.database.username).toBe('myuser');
      expect(config.database.password).toBe('mypassword');
      expect(config.database.database).toBe('mydb');
    });

    it('should disable synchronize in production', () => {
      process.env.NODE_ENV = 'production';
      const config = appConfig();
      expect(config.database.synchronize).toBe(false);
    });

    it('should enable synchronize in development', () => {
      process.env.NODE_ENV = 'development';
      const config = appConfig();
      expect(config.database.synchronize).toBe(true);
    });

    it('should enable logging in debug mode', () => {
      process.env.NODE_ENV = 'debug';
      const config = appConfig();
      expect(config.database.logging).toBe(true);
    });

    it('should disable logging in non-debug mode', () => {
      process.env.NODE_ENV = 'production';
      const config = appConfig();
      expect(config.database.logging).toBe(false);
    });
  });

  describe('OAuth2 provider configuration', () => {
    it('should parse Discord credentials', () => {
      process.env.DISCORD_CLIENT_ID = 'discord_id';
      process.env.DISCORD_CLIENT_SECRET = 'discord_secret';
      process.env.DISCORD_BOT_TOKEN = 'bot_token';

      const config = appConfig();

      expect(config.oauth2.discord.clientId).toBe('discord_id');
      expect(config.oauth2.discord.clientSecret).toBe('discord_secret');
      expect(config.oauth2.discord.botToken).toBe('bot_token');
    });

    it('should parse Google credentials', () => {
      process.env.GOOGLE_CLIENT_ID = 'google_id';
      process.env.GOOGLE_CLIENT_SECRET = 'google_secret';

      const config = appConfig();

      expect(config.oauth2.google.clientId).toBe('google_id');
      expect(config.oauth2.google.clientSecret).toBe('google_secret');
    });

    it('should parse Gmail credentials', () => {
      process.env.GMAIL_CLIENT_ID = 'gmail_id';
      process.env.GMAIL_CLIENT_SECRET = 'gmail_secret';

      const config = appConfig();

      expect(config.oauth2.gmail.clientId).toBe('gmail_id');
      expect(config.oauth2.gmail.clientSecret).toBe('gmail_secret');
    });

    it('should parse YouTube credentials', () => {
      process.env.YOUTUBE_CLIENT_ID = 'youtube_id';
      process.env.YOUTUBE_CLIENT_SECRET = 'youtube_secret';

      const config = appConfig();

      expect(config.oauth2.youtube.clientId).toBe('youtube_id');
      expect(config.oauth2.youtube.clientSecret).toBe('youtube_secret');
    });

    it('should parse GitHub credentials', () => {
      process.env.GITHUB_CLIENT_ID = 'github_id';
      process.env.GITHUB_CLIENT_SECRET = 'github_secret';

      const config = appConfig();

      expect(config.oauth2.github.clientId).toBe('github_id');
      expect(config.oauth2.github.clientSecret).toBe('github_secret');
    });

    it('should parse Twitch credentials', () => {
      process.env.TWITCH_CLIENT_ID = 'twitch_id';
      process.env.TWITCH_CLIENT_SECRET = 'twitch_secret';

      const config = appConfig();

      expect(config.oauth2.twitch.clientId).toBe('twitch_id');
      expect(config.oauth2.twitch.clientSecret).toBe('twitch_secret');
    });

    it('should parse Spotify credentials', () => {
      process.env.SPOTIFY_CLIENT_ID = 'spotify_id';
      process.env.SPOTIFY_CLIENT_SECRET = 'spotify_secret';

      const config = appConfig();

      expect(config.oauth2.spotify.clientId).toBe('spotify_id');
      expect(config.oauth2.spotify.clientSecret).toBe('spotify_secret');
    });

    it('should parse Trello credentials', () => {
      process.env.TRELLO_API_KEY = 'trello_key';
      process.env.TRELLO_API_SECRET = 'trello_secret';

      const config = appConfig();

      expect(config.oauth2.trello.apiKey).toBe('trello_key');
      expect(config.oauth2.trello.apiSecret).toBe('trello_secret');
    });
  });

  describe('email configuration', () => {
    it('should parse SMTP credentials', () => {
      process.env.SMTP_USER = 'smtp@example.com';
      process.env.SMTP_PASS = 'smtp_password';

      const config = appConfig();

      expect(config.email.smtpUser).toBe('smtp@example.com');
      expect(config.email.smtpPass).toBe('smtp_password');
    });

    it('should handle undefined SMTP credentials', () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const config = appConfig();

      expect(config.email.smtpUser).toBeUndefined();
      expect(config.email.smtpPass).toBeUndefined();
    });
  });

  describe('mobile configuration', () => {
    it('should parse Android configuration', () => {
      process.env.ANDROID_PACKAGE_NAME = 'com.example.app';
      process.env.ANDROID_SHA256_FINGERPRINT = 'AA:BB:CC:DD';

      const config = appConfig();

      expect(config.mobile.android.packageName).toBe('com.example.app');
      expect(config.mobile.android.sha256).toBe('AA:BB:CC:DD');
    });

    it('should parse iOS configuration', () => {
      process.env.IOS_TEAM_ID = 'TEAM123';
      process.env.IOS_BUNDLE_ID = 'com.example.app';

      const config = appConfig();

      expect(config.mobile.ios.teamId).toBe('TEAM123');
      expect(config.mobile.ios.bundleId).toBe('com.example.app');
    });
  });

  describe('OAuth2 redirect URIs', () => {
    it('should parse custom auth redirect URIs', () => {
      process.env.WEB_AUTH_REDIRECT_URI = 'https://web.example.com/auth';
      process.env.MOBILE_AUTH_REDIRECT_URI = 'https://mobile.example.com/auth';
      process.env.MOBILE_APP_AUTH_URL_SCHEME = 'myapp://auth';

      const config = appConfig();

      expect(config.oauth2.auth.web_redirect_uri).toBe(
        'https://web.example.com/auth',
      );
      expect(config.oauth2.auth.mobile_redirect_uri).toBe(
        'https://mobile.example.com/auth',
      );
      expect(config.oauth2.auth.mobile_scheme).toBe('myapp://auth');
    });

    it('should parse custom service redirect URIs', () => {
      process.env.WEB_SERVICE_REDIRECT_URI = 'https://web.example.com/service';
      process.env.MOBILE_SERVICE_REDIRECT_URI =
        'https://mobile.example.com/service';
      process.env.MOBILE_APP_SERVICE_URL_SCHEME = 'myapp://service';

      const config = appConfig();

      expect(config.oauth2.service.web_redirect_uri).toBe(
        'https://web.example.com/service',
      );
      expect(config.oauth2.service.mobile_redirect_uri).toBe(
        'https://mobile.example.com/service',
      );
      expect(config.oauth2.service.mobile_scheme).toBe('myapp://service');
    });
  });
});
