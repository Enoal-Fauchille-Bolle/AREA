import { z } from 'zod';
import { ConfigurationException } from '../common/exceptions/configuration.exception';

export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_SALT_ROUNDS: z.string().default('10'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_USERNAME: z.string().default('area_user'),
  DB_PASSWORD: z.string().default('area_password'),
  DB_DATABASE: z.string().default('area_db'),
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
  if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
    throw new ConfigurationException('JWT_SECRET must be set in production.');
  }
  return env;
}

export type EnvVars = z.infer<typeof envValidationSchema>;
