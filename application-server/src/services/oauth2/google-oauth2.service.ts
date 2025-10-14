import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config';

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

@Injectable()
export class GoogleOAuth2Service {
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly userInfoUrl =
    'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    this.clientId = appConfig.oauth2.google?.clientId;
    this.clientSecret = appConfig.oauth2.google?.clientSecret;

    // Log configuration status for debugging
    console.log('[GoogleOAuth2Service] Configuration loaded:', {
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
    code_verifier?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
    idToken: string;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('Google OAuth2 is not configured');
    }

    const paramsObj: Record<string, string> = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
    };

    // Only add code_verifier if it's provided (for PKCE flow)
    if (code_verifier) {
      paramsObj.code_verifier = code_verifier;
    }

    const params = new URLSearchParams(paramsObj);

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

      const data = (await response.json()) as GoogleTokenResponse;

      // Calculate token expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt,
        idToken: data.id_token,
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

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Failed to get user info: ${response.status} - ${errorData}`,
        );
      }

      const userInfo = (await response.json()) as GoogleUserInfo;
      return userInfo;
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
      throw new BadRequestException('Google OAuth2 is not configured');
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

      const data = (await response.json()) as GoogleTokenResponse;

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Google may not return a new refresh token
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
