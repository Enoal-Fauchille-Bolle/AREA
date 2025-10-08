import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config';

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

@Injectable()
export class DiscordOAuth2Service {
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly redirectUri: string;
  private readonly tokenUrl = 'https://discord.com/api/oauth2/token';

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    this.clientId = appConfig.oauth2.discord.clientId;
    this.clientSecret = appConfig.oauth2.discord.clientSecret;
    this.redirectUri = appConfig.oauth2.discord.redirectUri;
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('Discord OAuth2 is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Failed to exchange code for tokens: ${errorData}`,
        );
      }

      const data = (await response.json()) as DiscordTokenResponse;

      // Calculate token expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to exchange authorization code: ${errorMessage}`,
      );
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('Discord OAuth2 is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(`Failed to refresh token: ${errorData}`);
      }

      const data = (await response.json()) as DiscordTokenResponse;

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to refresh access token: ${errorMessage}`,
      );
    }
  }
}
