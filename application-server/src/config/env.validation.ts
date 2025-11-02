import { z } from 'zod';
import { Logger } from '@nestjs/common';
import { ConfigurationException } from '../common/exceptions/configuration.exception';

export const envValidationSchema = z.object({
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432'),
  POSTGRES_USER: z.string().default('area_user'),
  POSTGRES_PASSWORD: z.string().default('area_password'),
  POSTGRES_DB: z.string().default('area_db'),
  SERVER_URL: z.string().default('http://127.0.0.1:8080'),
  PORT: z.string().default('8080'),
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'debug'])
    .default('development'),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_SALT_ROUNDS: z.string().default('10'),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  TWITCH_CLIENT_ID: z.string().optional(),
  TWITCH_CLIENT_SECRET: z.string().optional(),
  REDDIT_DEV_USER_AGENT: z.string().optional(),
  REDDIT_DEV_CLIENT_ID: z.string().optional(),
  REDDIT_DEV_CLIENT_SECRET: z.string().optional(),
  REDDIT_PROD_USER_AGENT: z.string().optional(),
  REDDIT_PROD_CLIENT_ID: z.string().optional(),
  REDDIT_PROD_CLIENT_SECRET: z.string().optional(),
  TRELLO_API_KEY: z.string().optional(),
  TRELLO_API_SECRET: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ANDROID_PACKAGE_NAME: z.string().optional(),
  ANDROID_SHA256_FINGERPRINT: z.string().optional(),
  IOS_TEAM_ID: z.string().optional(),
  IOS_BUNDLE_ID: z.string().optional(),
  WEB_AUTH_REDIRECT_URI: z
    .string()
    .default('http://localhost:8081/auth/callback'),
  MOBILE_AUTH_REDIRECT_URI: z
    .string()
    .default('http://localhost:8080/auth/callback'),
  MOBILE_APP_AUTH_URL_SCHEME: z.string().default('area://auth/callback'),
  WEB_SERVICE_REDIRECT_URI: z
    .string()
    .default('http://localhost:8081/service/callback'),
  MOBILE_SERVICE_REDIRECT_URI: z
    .string()
    .default('http://localhost:8080/service/callback'),
  MOBILE_APP_SERVICE_URL_SCHEME: z.string().default('area://service/callback'),
});

export function validateEnv(config: Record<string, unknown>) {
  const logger = new Logger('EnvValidation');
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
    if (!env.DISCORD_BOT_TOKEN) {
      throw new ConfigurationException(
        'Discord Bot Token must be set in production.',
      );
    }
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new ConfigurationException(
        'Google OAuth2 must be set in production.',
      );
    }
    if (env.GMAIL_CLIENT_ID && !env.GMAIL_CLIENT_SECRET) {
      throw new ConfigurationException(
        'Gmail Client Secret must be set if Gmail Client ID is set in production.',
      );
    }
    if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) {
      throw new ConfigurationException(
        'YouTube OAuth2 must be set in production.',
      );
    }
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new ConfigurationException(
        'GitHub OAuth2 must be set in production.',
      );
    }
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      throw new ConfigurationException(
        'Spotify OAuth2 must be set in production.',
      );
    }
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
      throw new ConfigurationException(
        'Twitch OAuth2 must be set in production.',
      );
    }
    if (
      !env.REDDIT_PROD_USER_AGENT ||
      !env.REDDIT_PROD_CLIENT_ID ||
      !env.REDDIT_PROD_CLIENT_SECRET
    ) {
      throw new ConfigurationException(
        'Reddit OAuth2 must be set in production.',
      );
    }
    if (!env.TRELLO_API_KEY || !env.TRELLO_API_SECRET) {
      throw new ConfigurationException(
        'Trello API credentials must be set in production.',
      );
    }
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      throw new ConfigurationException(
        'SMTP credentials must be set in production.',
      );
    }
    if (!env.ANDROID_PACKAGE_NAME || !env.ANDROID_SHA256_FINGERPRINT) {
      throw new ConfigurationException(
        'Android package name and SHA256 fingerprint must be set in production.',
      );
    }
    if (!env.IOS_TEAM_ID || !env.IOS_BUNDLE_ID) {
      throw new ConfigurationException(
        'iOS team ID and bundle ID must be set in production.',
      );
    }
  } else {
    if (!env.JWT_SECRET) {
      logger.warn('Using default JWT secret for development.');
    }
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
      logger.warn('Discord OAuth2 not set; server may crash.');
    }
    if (!env.DISCORD_BOT_TOKEN) {
      logger.warn(
        'Discord Bot Token not set; Discord REActions will not work.',
      );
    }
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      logger.warn('Google OAuth2 not set; server may crash.');
    }
    if (env.GMAIL_CLIENT_ID && !env.GMAIL_CLIENT_SECRET) {
      logger.warn(
        'Gmail Client Secret not set; Gmail integration may not work.',
      );
    }
    if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) {
      logger.warn('YouTube OAuth2 not set; server may crash.');
    }
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      logger.warn('GitHub OAuth2 not set; server may crash.');
    }
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
      logger.warn('Spotify OAuth2 not set; server may crash.');
    }
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
      logger.warn('Twitch OAuth2 not set; server may crash.');
    }
    if (
      !env.REDDIT_DEV_USER_AGENT ||
      !env.REDDIT_DEV_CLIENT_ID ||
      !env.REDDIT_DEV_CLIENT_SECRET
    ) {
      logger.warn('Reddit OAuth2 not set; server may crash.');
    }
    if (!env.TRELLO_API_KEY || !env.TRELLO_API_SECRET) {
      logger.warn(
        'WARNING: Trello API credentials not set; Trello integration will not work.',
      );
    }
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn('SMTP credentials not set; email may not work.');
    }
    if (!env.ANDROID_PACKAGE_NAME || !env.ANDROID_SHA256_FINGERPRINT) {
      logger.warn('Android config not set; some mobile features may not work.');
    }
    if (!env.IOS_TEAM_ID || !env.IOS_BUNDLE_ID) {
      logger.warn('iOS config not set; some mobile features may not work.');
    }
  }
  return env;
}

export type EnvVars = z.infer<typeof envValidationSchema>;
