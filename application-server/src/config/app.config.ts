import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  // Server Configuration
  serverUrl: process.env.SERVER_URL || 'http://127.0.0.1:8080',
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Database Configuration
  database: {
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
  },

  // Time Constants (in milliseconds)
  time: {
    minuteInMs: 60 * 1000,
    hourInMs: 60 * 60 * 1000,
    dayInMs: 24 * 60 * 60 * 1000,
  },

  // OAuth2 Configuration
  oauth2: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      redirectUri:
        process.env.DISCORD_REDIRECT_URI ||
        'http://localhost:3000/auth/discord/callback',
    },
  },
}));

export type AppConfig = ReturnType<typeof appConfig>;
export default appConfig;
