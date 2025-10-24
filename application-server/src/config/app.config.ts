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
          process.env.WEB_SERVICE_REDIRECT_URI ||
          'http://localhost:8081/auth/callback',
        mobile_redirect_uri:
          process.env.MOBILE_SERVICE_REDIRECT_URI || 'area://auth/callback',
      },
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
        botToken: process.env.DISCORD_BOT_TOKEN,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },

    // Email Configuration
    email: {
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
    },
  };
});

export type AppConfig = ReturnType<typeof appConfig>;
export default appConfig;
