import { z } from 'zod';
import { ConfigurationException } from '../common/exceptions/configuration.exception';

export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  SERVER_URL: z.string().default('http://127.0.0.1:8080'),
  PORT: z.string().default('8080'),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_SALT_ROUNDS: z.string().default('10'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_USERNAME: z.string().default('area_user'),
  DB_PASSWORD: z.string().default('area_password'),
  DB_DATABASE: z.string().default('area_db'),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_REDIRECT_URI: z
    .string()
    .default('http://localhost:8081/auth/discord/callback'),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envValidationSchema.safeParse(config);
  if (!parsed.success) {
    throw new ConfigurationException(
      'Invalid environment variables:\n' +
        JSON.stringify(z.treeifyError(parsed.error), null, 2),
    );
  }

  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    if (!env.JWT_SECRET) {
      throw new ConfigurationException('JWT_SECRET must be set in production.');
    }
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
      throw new ConfigurationException(
        'Discord OAuth2 must be set in production.',
      );
    }
  } else {
    if (!env.JWT_SECRET) {
      console.warn('WARNING: Using default JWT secret for development.');
    }
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
      console.warn('WARNING: Discord OAuth2 not set; server may crash.');
    }
  }
  return env;
}

export type EnvVars = z.infer<typeof envValidationSchema>;
