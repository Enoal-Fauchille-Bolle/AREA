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
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'area_user',
      password: process.env.POSTGRES_PASSWORD || 'area_password',
      database: process.env.POSTGRES_DB || 'area_db',
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    },

    // OAuth2 Configuration
    oauth2: {
      auth: {
        web_redirect_uri:
          process.env.WEB_AUTH_REDIRECT_URI ||
          'http://localhost:8081/auth/callback',
        mobile_redirect_uri:
          process.env.MOBILE_AUTH_REDIRECT_URI ||
          'http://localhost:8080/auth/callback',
        mobile_scheme:
          process.env.MOBILE_APP_AUTH_URL_SCHEME || 'area://auth/callback',
      },
      service: {
        web_redirect_uri:
          process.env.WEB_SERVICE_REDIRECT_URI ||
          'http://localhost:8081/service/callback',
        mobile_redirect_uri:
          process.env.MOBILE_SERVICE_REDIRECT_URI ||
          'http://localhost:8080/service/callback',
        mobile_scheme:
          process.env.MOBILE_APP_SERVICE_URL_SCHEME ||
          'area://service/callback',
      },
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        botToken: process.env.DISCORD_BOT_TOKEN,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
      },
      youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      twitch: {
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
      },
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      },
      trello: {
        apiKey: process.env.TRELLO_API_KEY,
        apiSecret: process.env.TRELLO_API_SECRET,
      },
    },

    // Email Configuration
    email: {
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
    },

    // Mobile related Configuration
    mobile: {
      android: {
        packageName: process.env.ANDROID_PACKAGE_NAME,
        sha256: process.env.ANDROID_SHA256_FINGERPRINT,
      },
      ios: {
        teamId: process.env.IOS_TEAM_ID,
        bundleId: process.env.IOS_BUNDLE_ID,
      },
    },
  };
});

export type AppConfig = ReturnType<typeof appConfig>;
export default appConfig;
