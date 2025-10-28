import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config';

@Injectable()
export class YouTubeOAuth2Service {
  private readonly logger = new Logger(YouTubeOAuth2Service.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }

    this.clientId = appConfig.oauth2.youtube?.clientId;
    this.clientSecret = appConfig.oauth2.youtube?.clientSecret;

    this.logger.log('[YouTubeOAuth2Service] Configuration loaded:', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      clientIdPreview: this.clientId
        ? `${this.clientId.substring(0, 20)}...`
        : 'undefined',
    });
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('YouTube OAuth2 is not properly configured');
    }

    this.logger.log('Exchanging YouTube authorization code for tokens');

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      this.logger.error(
        'Failed to exchange YouTube code for tokens:',
        errorData,
      );
      throw new Error(`Failed to exchange code for tokens: ${errorData}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

    this.logger.log('Successfully exchanged YouTube code for tokens');

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('YouTube OAuth2 is not properly configured');
    }

    this.logger.log('Refreshing YouTube access token');

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      this.logger.error('Failed to refresh YouTube access token:', errorData);
      throw new Error(`Failed to refresh access token: ${errorData}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

    this.logger.log('Successfully refreshed YouTube access token');

    return {
      accessToken: data.access_token,
      expiresAt,
    };
  }
}
