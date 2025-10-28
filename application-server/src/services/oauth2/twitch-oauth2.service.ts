import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config';

interface TwitchTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string[];
}

export interface TwitchUserInfo {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

@Injectable()
export class TwitchOAuth2Service {
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly tokenUrl = 'https://id.twitch.tv/oauth2/token';
  private readonly userInfoUrl = 'https://api.twitch.tv/helix/users';

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    this.clientId = appConfig.oauth2.twitch?.clientId;
    this.clientSecret = appConfig.oauth2.twitch?.clientSecret;

    // Log configuration status for debugging
    console.log('[TwitchOAuth2Service] Configuration loaded:', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      clientIdPreview: this.clientId
        ? `${this.clientId.substring(0, 20)}...`
        : 'undefined',
    });
  }

  async exchangeCodeForTokens(
    code: string,
    redirect_uri: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('Twitch OAuth2 is not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
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

      const data = (await response.json()) as TwitchTokenResponse;

      // Calculate token expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
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

  async getUserInfo(accessToken: string): Promise<TwitchUserInfo> {
    if (!this.clientId) {
      throw new BadRequestException('Twitch OAuth2 is not configured');
    }

    try {
      const response = await fetch(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': this.clientId,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Failed to get user info: ${response.status} - ${errorData}`,
        );
      }

      const data = (await response.json()) as { data: TwitchUserInfo[] };
      if (!data.data || data.data.length === 0) {
        throw new BadRequestException('No user data returned from Twitch');
      }

      return data.data[0];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to get user info: ${errorMessage}`);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('Twitch OAuth2 is not configured');
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

      const data = (await response.json()) as TwitchTokenResponse;

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
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

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/validate', {
        headers: {
          Authorization: `OAuth ${accessToken}`,
        },
      });

      return response.ok;
    } catch (_error) {
      return false;
    }
  }
}
