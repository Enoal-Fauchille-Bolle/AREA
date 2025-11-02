import { validateEnv, envValidationSchema } from './env.validation';
import { ConfigurationException } from '../common/exceptions/configuration.exception';

describe('env.validation', () => {
  describe('envValidationSchema', () => {
    it('should accept valid environment variables', () => {
      const validEnv = {
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: '5432',
        POSTGRES_USER: 'test_user',
        POSTGRES_PASSWORD: 'test_password',
        POSTGRES_DB: 'test_db',
        JWT_SECRET: 'test_secret',
        NODE_ENV: 'development',
      };

      const result = envValidationSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should apply default values for missing optional fields', () => {
      const minimalEnv = {};

      const result = envValidationSchema.safeParse(minimalEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.POSTGRES_HOST).toBe('localhost');
        expect(result.data.POSTGRES_PORT).toBe('5432');
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.PORT).toBe('8080');
      }
    });

    it('should accept all valid NODE_ENV values', () => {
      const envs = ['development', 'production', 'test', 'debug'];

      for (const env of envs) {
        const config = { NODE_ENV: env };
        const result = envValidationSchema.safeParse(config);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid NODE_ENV', () => {
      const config = { NODE_ENV: 'invalid' };
      const result = envValidationSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('validateEnv', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should pass validation with minimal required fields in development', () => {
      const config = {
        NODE_ENV: 'development',
      };

      const result = validateEnv(config);
      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
    });

    it('should throw ConfigurationException for invalid schema', () => {
      const config = {
        NODE_ENV: 'invalid_env',
      };

      expect(() => validateEnv(config)).toThrow(ConfigurationException);
      expect(() => validateEnv(config)).toThrow(
        'Invalid environment variables',
      );
    });

    describe('production environment', () => {
      it('should require JWT_SECRET in production', () => {
        const config = {
          NODE_ENV: 'production',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'JWT_SECRET must be set in production',
        );
      });

      it('should require Discord OAuth2 in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Discord OAuth2 must be set in production',
        );
      });

      it('should require Discord Bot Token in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Discord Bot Token must be set in production',
        );
      });

      it('should require Google OAuth2 in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Google OAuth2 must be set in production',
        );
      });

      it('should require YouTube OAuth2 in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'YouTube OAuth2 must be set in production',
        );
      });

      it('should require GitHub OAuth2 in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'GitHub OAuth2 must be set in production',
        );
      });

      it('should require Spotify OAuth2 in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Spotify OAuth2 must be set in production',
        );
      });

      it('should require Twitch OAuth2 in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
          SPOTIFY_CLIENT_ID: 'id',
          SPOTIFY_CLIENT_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Twitch OAuth2 must be set in production',
        );
      });

      it('should require Trello API credentials in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
          SPOTIFY_CLIENT_ID: 'id',
          SPOTIFY_CLIENT_SECRET: 'secret',
          TWITCH_CLIENT_ID: 'id',
          TWITCH_CLIENT_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Trello API credentials must be set in production',
        );
      });

      it('should require SMTP credentials in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
          SPOTIFY_CLIENT_ID: 'id',
          SPOTIFY_CLIENT_SECRET: 'secret',
          TWITCH_CLIENT_ID: 'id',
          TWITCH_CLIENT_SECRET: 'secret',
          TRELLO_API_KEY: 'key',
          TRELLO_API_SECRET: 'secret',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'SMTP credentials must be set in production',
        );
      });

      it('should require Android config in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
          SPOTIFY_CLIENT_ID: 'id',
          SPOTIFY_CLIENT_SECRET: 'secret',
          TWITCH_CLIENT_ID: 'id',
          TWITCH_CLIENT_SECRET: 'secret',
          TRELLO_API_KEY: 'key',
          TRELLO_API_SECRET: 'secret',
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Android package name and SHA256 fingerprint must be set in production',
        );
      });

      it('should require iOS config in production', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
          SPOTIFY_CLIENT_ID: 'id',
          SPOTIFY_CLIENT_SECRET: 'secret',
          TWITCH_CLIENT_ID: 'id',
          TWITCH_CLIENT_SECRET: 'secret',
          TRELLO_API_KEY: 'key',
          TRELLO_API_SECRET: 'secret',
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          ANDROID_PACKAGE_NAME: 'com.example.app',
          ANDROID_SHA256_FINGERPRINT: 'AA:BB:CC',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'iOS team ID and bundle ID must be set in production',
        );
      });

      it('should pass with all required production variables', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
          SPOTIFY_CLIENT_ID: 'id',
          SPOTIFY_CLIENT_SECRET: 'secret',
          TWITCH_CLIENT_ID: 'id',
          TWITCH_CLIENT_SECRET: 'secret',
          TRELLO_API_KEY: 'key',
          TRELLO_API_SECRET: 'secret',
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          ANDROID_PACKAGE_NAME: 'com.example.app',
          ANDROID_SHA256_FINGERPRINT: 'AA:BB:CC',
          IOS_TEAM_ID: 'team_id',
          IOS_BUNDLE_ID: 'com.example.app',
        };

        const result = validateEnv(config);
        expect(result).toBeDefined();
        expect(result.NODE_ENV).toBe('production');
      });

      it('should require Gmail secret if Gmail client ID is set', () => {
        const config = {
          NODE_ENV: 'production',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
          DISCORD_BOT_TOKEN: 'token',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          GMAIL_CLIENT_ID: 'gmail_id',
          // Missing GMAIL_CLIENT_SECRET
          YOUTUBE_CLIENT_ID: 'id',
          YOUTUBE_CLIENT_SECRET: 'secret',
          GITHUB_CLIENT_ID: 'id',
          GITHUB_CLIENT_SECRET: 'secret',
          SPOTIFY_CLIENT_ID: 'id',
          SPOTIFY_CLIENT_SECRET: 'secret',
          TWITCH_CLIENT_ID: 'id',
          TWITCH_CLIENT_SECRET: 'secret',
          TRELLO_API_KEY: 'key',
          TRELLO_API_SECRET: 'secret',
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          ANDROID_PACKAGE_NAME: 'com.example.app',
          ANDROID_SHA256_FINGERPRINT: 'AA:BB:CC',
          IOS_TEAM_ID: 'team_id',
          IOS_BUNDLE_ID: 'com.example.app',
        };

        expect(() => validateEnv(config)).toThrow(ConfigurationException);
        expect(() => validateEnv(config)).toThrow(
          'Gmail Client Secret must be set if Gmail Client ID is set in production',
        );
      });
    });

    describe('development environment', () => {
      it('should show warning for missing JWT_SECRET', () => {
        const config = {
          NODE_ENV: 'development',
        };

        validateEnv(config);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'WARNING: Using default JWT secret for development.',
        );
      });

      it('should show warning for missing Discord OAuth2', () => {
        const config = {
          NODE_ENV: 'development',
          JWT_SECRET: 'secret',
        };

        validateEnv(config);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'WARNING: Discord OAuth2 not set; server may crash.',
        );
      });

      it('should show warning for missing Discord Bot Token', () => {
        const config = {
          NODE_ENV: 'development',
          JWT_SECRET: 'secret',
          DISCORD_CLIENT_ID: 'id',
          DISCORD_CLIENT_SECRET: 'secret',
        };

        validateEnv(config);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'WARNING: Discord Bot Token not set; Discord REActions will not work.',
        );
      });

      it('should not throw errors in development with minimal config', () => {
        const config = {
          NODE_ENV: 'development',
        };

        expect(() => validateEnv(config)).not.toThrow();
      });

      it('should show warning for Gmail secret if ID is set', () => {
        const config = {
          NODE_ENV: 'development',
          JWT_SECRET: 'secret',
          GMAIL_CLIENT_ID: 'gmail_id',
        };

        validateEnv(config);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'WARNING: Gmail Client Secret not set; Gmail integration may not work.',
        );
      });
    });

    describe('test environment', () => {
      it('should validate successfully with minimal config in test mode', () => {
        const config = {
          NODE_ENV: 'test',
        };

        const result = validateEnv(config);
        expect(result).toBeDefined();
        expect(result.NODE_ENV).toBe('test');
      });
    });

    describe('debug environment', () => {
      it('should validate successfully in debug mode', () => {
        const config = {
          NODE_ENV: 'debug',
        };

        const result = validateEnv(config);
        expect(result).toBeDefined();
        expect(result.NODE_ENV).toBe('debug');
      });
    });
  });
});
