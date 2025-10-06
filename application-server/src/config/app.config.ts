import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;

  const secret =
    jwtSecret ||
    (() => {
      console.warn('WARNING: Using default JWT secret for development.');
      return 'dev-default-secret-key';
    })();

  return {
    // Server Configuration
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Security
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),

    // JWT Configuration
    jwt: {
      secret,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    // Database Configuration
    database: {
      synchronize: !isProduction,
      logging: !isProduction,
    },

    // Time Constants (in milliseconds)
    time: {
      minuteInMs: 60 * 1000,
      hourInMs: 60 * 60 * 1000,
      dayInMs: 24 * 60 * 60 * 1000,
    },
  };
});

export type AppConfig = ReturnType<typeof appConfig>;
export default appConfig;
