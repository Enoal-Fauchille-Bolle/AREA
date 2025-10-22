import { registerAs } from '@nestjs/config';

type JwtExpiresIn =
  | number
  | `${number}${'h' | 'm' | 's' | 'ms' | 'd' | 'y' | 'w'}`
  | `${number} ${'h' | 'm' | 's' | 'ms' | 'd' | 'y' | 'w'}`;

export const appConfig = registerAs('app', () => {
  // Parse JWT_EXPIRES_IN - can be a number (seconds) or a time string
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const jwtExpiresInValue: JwtExpiresIn = /^\d+$/.test(jwtExpiresIn)
    ? parseInt(jwtExpiresIn, 10)
    : (jwtExpiresIn as JwtExpiresIn);

  return {
    // Server Configuration
    serverUrl: process.env.SERVER_URL || 'http://127.0.0.1:8080',
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Security
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),

    // JWT Configuration
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-default-secret-key',
      expiresIn: jwtExpiresInValue,
    },

    // Database Configuration
    database: {
      synchronize: process.env.NODE_ENV !== 'production',
      logging: true,
    },

    // Time Constants (in milliseconds)
    time: {
      minuteInMs: 60 * 1000,
      hourInMs: 60 * 60 * 1000,
      dayInMs: 24 * 60 * 60 * 1000,
    },

    // OAuth2 Configuration
    oauth2: {
      service: {
        web_redirect_uri:
          process.env.WEB_SERVICE_REDIRECT_URI ||
          'http://localhost:8081/service/callback',
        mobile_redirect_uri:
          process.env.MOBILE_SERVICE_REDIRECT_URI || 'area://service/callback',
      },
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      twitch: {
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
      },
    },
  };
});

// Debug logging
console.log('[app.config] Google OAuth2 Environment Variables:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
    ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`
    : 'undefined',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'undefined',
});

export type AppConfig = ReturnType<typeof appConfig>;
export default appConfig;
