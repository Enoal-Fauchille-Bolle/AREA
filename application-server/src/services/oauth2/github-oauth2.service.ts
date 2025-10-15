import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config';

interface GithubTokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

@Injectable()
export class GithubOAuth2Service {
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly tokenUrl = 'https://github.com/login/oauth/access_token';

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    this.clientId = appConfig.oauth2.github.clientId;
    this.clientSecret = appConfig.oauth2.github.clientSecret;
  }

  async exchangeCodeForTokens(
    code: string,
    redirect_uri: string,
    code_verifier?: string,
  ): Promise<{
    accessToken: string;
  }> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('GitHub OAuth2 is not configured');
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
          Accept: 'application/json',
        },
        body: params,
      });

      const data = (await response.json()) as GithubTokenResponse;

      if (!response.ok || data.error) {
        const errorData = await response.text();
        throw new BadRequestException(
          `Failed to exchange code for tokens: ${errorData}`,
        );
      }

      return {
        accessToken: data.access_token,
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
}
