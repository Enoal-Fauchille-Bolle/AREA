import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { OAuth2ResponseDto } from './dto/oauth2-response.dto';
import {
  OAuthProvider,
  ExchangeOAuthCodeDto,
  RefreshOAuthTokenDto,
  ProviderTokenResponse,
  DiscordUserInfo,
  GoogleUserInfo,
  GitHubUserInfo,
  GitHubEmailInfo,
  RedditUserInfo,
  SpotifyUserInfo,
  TwitchUserInfo,
  ProviderUserInfo,
} from './dto/oauth-providers.dto';

@Injectable()
export class OAuth2Service {
  private readonly TOKEN_URLS: Record<OAuthProvider, string> = {
    [OAuthProvider.DISCORD]: 'https://discord.com/api/oauth2/token',
    [OAuthProvider.GOOGLE]: 'https://oauth2.googleapis.com/token',
    [OAuthProvider.GMAIL]: 'https://oauth2.googleapis.com/token',
    [OAuthProvider.GITHUB]: 'https://github.com/login/oauth/access_token',
    [OAuthProvider.REDDIT]: 'https://www.reddit.com/api/v1/access_token',
    [OAuthProvider.SPOTIFY]: 'https://accounts.spotify.com/api/token',
    [OAuthProvider.TWITCH]: 'https://id.twitch.tv/oauth2/token',
  };
  private readonly CLIENT_IDS: Record<OAuthProvider, string | undefined>;
  private readonly CLIENT_SECRETS: Record<OAuthProvider, string | undefined>;
  private readonly REDDIT_USER_AGENT: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const appConfig = this.configService.get('app');

    this.CLIENT_IDS = {
      [OAuthProvider.DISCORD]: appConfig.oauth2.discord.clientId,
      [OAuthProvider.GOOGLE]: appConfig.oauth2.google.clientId,
      [OAuthProvider.GMAIL]: appConfig.oauth2.gmail.clientId,
      [OAuthProvider.GITHUB]: appConfig.oauth2.github.clientId,
      [OAuthProvider.REDDIT]:
        appConfig.nodeEnv === 'production'
          ? appConfig.oauth2.reddit.clientIdProd
          : appConfig.oauth2.reddit.clientIdDev,
      [OAuthProvider.SPOTIFY]: appConfig.oauth2.spotify.clientId,
      [OAuthProvider.TWITCH]: appConfig.oauth2.twitch.clientId,
    };

    this.CLIENT_SECRETS = {
      [OAuthProvider.DISCORD]: appConfig.oauth2.discord.clientSecret,
      [OAuthProvider.GOOGLE]: appConfig.oauth2.google.clientSecret,
      [OAuthProvider.GMAIL]: appConfig.oauth2.gmail.clientSecret,
      [OAuthProvider.GITHUB]: appConfig.oauth2.github.clientSecret,
      [OAuthProvider.REDDIT]:
        appConfig.nodeEnv === 'production'
          ? appConfig.oauth2.reddit.clientSecretProd
          : appConfig.oauth2.reddit.clientSecretDev,
      [OAuthProvider.SPOTIFY]: appConfig.oauth2.spotify.clientSecret,
      [OAuthProvider.TWITCH]: appConfig.oauth2.twitch.clientSecret,
    };

    this.REDDIT_USER_AGENT =
      appConfig.nodeEnv === 'production'
        ? appConfig.oauth2.reddit.prodUserAgent
        : appConfig.oauth2.reddit.devUserAgent;
  }

  async exchangeCodeForTokens(
    dto: ExchangeOAuthCodeDto,
  ): Promise<ProviderTokenResponse> {
    const tokenUrl = this.TOKEN_URLS[dto.provider];
    const clientId = this.CLIENT_IDS[dto.provider];
    const clientSecret = this.CLIENT_SECRETS[dto.provider];
    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        `${dto.provider} OAuth2 is not configured properly.`,
      );
    }

    try {
      // Reddit requires Basic Auth instead of client_id/client_secret in body
      const isReddit = dto.provider === OAuthProvider.REDDIT;

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: dto.code,
        redirect_uri: dto.redirect_uri,
      });

      // For non-Reddit providers, include client_id and client_secret in body
      if (!isReddit) {
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      };

      // Reddit requires Basic Auth header and User-Agent
      if (isReddit) {
        if (!this.REDDIT_USER_AGENT) {
          throw new InternalServerErrorException(
            'Reddit User-Agent is not configured properly.',
          );
        }
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
          'base64',
        );
        headers['Authorization'] = `Basic ${auth}`;
        headers['User-Agent'] = this.REDDIT_USER_AGENT;
      }

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params, {
          headers,
        }),
      );
      return response.data as ProviderTokenResponse;
    } catch (error) {
      if (this.isAxiosError(error)) {
        const errorData = error.response?.data as
          | { error?: string; error_description?: string }
          | undefined;
        throw new BadRequestException(
          `Invalid authorization code for ${dto.provider}: ${errorData?.error || error.message} - ${errorData?.error_description || ''}`,
        );
      }
      throw new InternalServerErrorException(
        `Failed to exchange code for tokens with ${dto.provider}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async refreshAccessToken(
    dto: RefreshOAuthTokenDto,
  ): Promise<ProviderTokenResponse> {
    const tokenUrl = this.TOKEN_URLS[dto.provider];
    const clientId = this.CLIENT_IDS[dto.provider];
    const clientSecret = this.CLIENT_SECRETS[dto.provider];
    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        `${dto.provider} OAuth2 is not configured properly.`,
      );
    }

    try {
      // Reddit requires Basic Auth instead of client_id/client_secret in body
      const isReddit = dto.provider === OAuthProvider.REDDIT;

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: dto.refresh_token,
      });

      // For non-Reddit providers, include client_id and client_secret in body
      if (!isReddit) {
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      };

      // Reddit requires Basic Auth header and User-Agent
      if (isReddit) {
        if (!this.REDDIT_USER_AGENT) {
          throw new InternalServerErrorException(
            'Reddit User-Agent is not configured properly.',
          );
        }
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
          'base64',
        );
        headers['Authorization'] = `Basic ${auth}`;
        headers['User-Agent'] = this.REDDIT_USER_AGENT;
      }

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params, {
          headers,
        }),
      );
      return response.data as ProviderTokenResponse;
    } catch (error) {
      if (this.isAxiosError(error)) {
        const errorData = error.response?.data as
          | { error?: string }
          | undefined;
        throw new BadRequestException(
          `Invalid or expired refresh token for ${dto.provider}: ${errorData?.error || error.message}`,
        );
      }
      throw new InternalServerErrorException(
        `Failed to refresh access token with ${dto.provider}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserInfo(
    provider: OAuthProvider,
    accessToken: string,
  ): Promise<ProviderUserInfo> {
    switch (provider) {
      case OAuthProvider.DISCORD:
        return this.getDiscordUserInfo(accessToken);
      case OAuthProvider.GOOGLE:
      case OAuthProvider.GMAIL:
        return this.getGoogleUserInfo(accessToken);
      case OAuthProvider.GITHUB:
        return this.getGithubUserInfo(accessToken);
      case OAuthProvider.REDDIT:
        return this.getRedditUserInfo(accessToken);
      case OAuthProvider.SPOTIFY:
        return this.getSpotifyUserInfo(accessToken);
      case OAuthProvider.TWITCH:
        return this.getTwitchUserInfo(accessToken);
      default:
        throw new BadRequestException(
          `Unsupported OAuth provider: ${provider as string}`,
        );
    }
  }

  async exchangeCodeAndGetUserInfo(
    dto: ExchangeOAuthCodeDto,
  ): Promise<OAuth2ResponseDto> {
    const tokenData = await this.exchangeCodeForTokens(dto);
    const userInfo = await this.getUserInfo(
      dto.provider,
      tokenData.access_token,
    );

    const additionalData =
      dto.provider === OAuthProvider.GITHUB
        ? {
            githubEmails: await this.getGithubUserEmail(tokenData.access_token),
          }
        : undefined;

    return OAuth2ResponseDto.fromProviderData(
      dto.provider,
      userInfo,
      tokenData,
      additionalData,
    );
  }

  async refreshTokenAndGetUserInfo(
    dto: RefreshOAuthTokenDto,
  ): Promise<OAuth2ResponseDto> {
    const tokenData = await this.refreshAccessToken(dto);
    const userInfo = await this.getUserInfo(
      dto.provider,
      tokenData.access_token,
    );

    const additionalData =
      dto.provider === OAuthProvider.GITHUB
        ? {
            githubEmails: await this.getGithubUserEmail(tokenData.access_token),
          }
        : undefined;

    return OAuth2ResponseDto.fromProviderData(
      dto.provider,
      userInfo,
      tokenData,
      additionalData,
    );
  }

  private async getDiscordUserInfo(
    accessToken: string,
  ): Promise<DiscordUserInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<DiscordUserInfo>(
          'https://discord.com/api/v10/users/@me',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleProviderError(error, 'Discord');
    }
  }

  private async getGoogleUserInfo(
    accessToken: string,
  ): Promise<GoogleUserInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GoogleUserInfo>(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleProviderError(error, 'Google');
    }
  }

  private async getGithubUserInfo(
    accessToken: string,
  ): Promise<GitHubUserInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GitHubUserInfo>('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleProviderError(error, 'GitHub');
    }
  }

  private async getGithubUserEmail(
    accessToken: string,
  ): Promise<GitHubEmailInfo[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GitHubEmailInfo[]>(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleProviderError(error, 'GitHub');
    }
  }

  private async getSpotifyUserInfo(
    accessToken: string,
  ): Promise<SpotifyUserInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SpotifyUserInfo>('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.handleProviderError(error, 'Spotify');
    }
  }

  private async getTwitchUserInfo(
    accessToken: string,
  ): Promise<TwitchUserInfo> {
    try {
      if (!this.CLIENT_IDS[OAuthProvider.TWITCH]) {
        throw new InternalServerErrorException(
          'Twitch Client ID is not configured properly.',
        );
      }
      const response = await firstValueFrom(
        this.httpService.get<{ data: TwitchUserInfo[] }>(
          'https://api.twitch.tv/helix/users',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Client-Id': this.CLIENT_IDS[OAuthProvider.TWITCH],
            },
          },
        ),
      );
      if (response.data.data.length === 0) {
        throw new UnauthorizedException('No user data found from Twitch API');
      }
      return response.data.data[0];
    } catch (error) {
      this.handleProviderError(error, 'Twitch');
    }
  }

  private async getRedditUserInfo(
    accessToken: string,
  ): Promise<RedditUserInfo> {
    try {
      if (!this.REDDIT_USER_AGENT) {
        throw new InternalServerErrorException(
          'Reddit User-Agent is not configured properly.',
        );
      }
      const response = await firstValueFrom(
        this.httpService.get<RedditUserInfo>(
          'https://oauth.reddit.com/api/v1/me',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'User-Agent': this.REDDIT_USER_AGENT,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleProviderError(error, 'Reddit');
    }
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true;
  }

  private handleProviderError(error: unknown, providerName: string): never {
    if (this.isAxiosError(error)) {
      const errorData = error.response?.data as { error?: string } | undefined;
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new UnauthorizedException(
          `Unauthorized access to ${providerName} API: ${errorData?.error || error.message}`,
        );
      }
      throw new BadRequestException(
        `Error from ${providerName} API: ${errorData?.error || error.message}`,
      );
    }
    throw new InternalServerErrorException(
      `Unexpected error when accessing ${providerName} API: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
