import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  OAuthProvider,
  DiscordTokenResponse,
  GoogleTokenResponse,
  GithubTokenResponse,
  SpotifyTokenResponse,
  TwitchTokenResponse,
  RedditTokenResponse,
  ProviderTokenResponse,
  type DiscordUserInfo,
  type GoogleUserInfo,
  type GitHubUserInfo,
  type GitHubEmailInfo,
  type SpotifyUserInfo,
  type TwitchUserInfo,
  type RedditUserInfo,
  type ProviderUserInfo,
} from './oauth-providers.dto';

export class OAuth2ResponseDto {
  // Token information
  @ApiProperty({
    description: 'The access token issued by the OAuth2 provider',
    example: 'ya29.a0AfH6SMC...',
  })
  access_token: string;

  @ApiPropertyOptional({
    description: 'The refresh token issued by the OAuth2 provider (if any)',
    example: '1//0gL...',
    nullable: true,
  })
  refresh_token: string | null;

  @ApiProperty({
    description: 'The type of the token issued (usually Bearer)',
    example: 'Bearer',
  })
  token_type: string;

  @ApiPropertyOptional({
    description:
      'The duration in seconds before the access token expires (if any)',
    example: 3599,
    nullable: true,
  })
  expires_in: number | null;

  @ApiPropertyOptional({
    description: 'The date and time when the access token expires (if any)',
    example: '2023-01-01T01:00:00Z',
    type: Date,
    nullable: true,
  })
  expired_at: Date | null;

  @ApiProperty({
    description: 'The scopes granted by the OAuth2 provider',
    example: ['email', 'profile', 'openid'],
    type: [String],
    isArray: true,
  })
  scopes: string[];

  // User information
  @ApiProperty({
    description: 'The unique identifier of the user from the OAuth2 provider',
    example: '12345678901234567890',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'The email address of the user (if available)',
    example: 'user@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description:
      'Whether the email address of the user is verified (default to false if not provided)',
    example: true,
  })
  email_verified: boolean;

  @ApiPropertyOptional({
    description: 'The name of the user (if available)',
    example: 'John Doe',
    nullable: true,
  })
  name: string | null;

  @ApiPropertyOptional({
    description: 'The username or handle of the user (if available)',
    example: 'johndoe',
    nullable: true,
  })
  username: string | null;

  @ApiPropertyOptional({
    description: 'The avatar/profile picture URL of the user (if available)',
    example: 'https://cdn.example.com/avatar.png',
    nullable: true,
  })
  avatar_url: string | null;

  @ApiProperty({
    description: 'The OAuth2 provider this data is associated with',
    enum: OAuthProvider,
    example: OAuthProvider.DISCORD,
  })
  provider: OAuthProvider;

  // Raw response data
  @ApiProperty({
    description: 'The raw user data received from the OAuth2 provider',
    type: Object,
    oneOf: [
      { $ref: '#/components/schemas/DiscordUserInfo' },
      { $ref: '#/components/schemas/GoogleUserInfo' },
      { $ref: '#/components/schemas/GitHubUserInfo' },
      { $ref: '#/components/schemas/SpotifyUserInfo' },
      { $ref: '#/components/schemas/TwitchUserInfo' },
      { $ref: '#/components/schemas/RedditUserInfo' },
    ],
  })
  rawData: ProviderUserInfo;

  constructor(
    data: Omit<OAuth2ResponseDto, 'isTokenExpired' | 'getTokenExpirationInfo'>,
  ) {
    Object.assign(this, data);
  }

  static fromProviderData(
    provider: OAuthProvider,
    raw: ProviderUserInfo,
    tokenData: ProviderTokenResponse,
    additionalData?: { githubEmails?: GitHubEmailInfo[] },
  ): OAuth2ResponseDto {
    switch (provider) {
      case OAuthProvider.DISCORD:
        return mapDiscordUserInfo(
          raw as DiscordUserInfo,
          tokenData as DiscordTokenResponse,
        );
      case OAuthProvider.GOOGLE:
      case OAuthProvider.GMAIL:
        return mapGoogleUserInfo(
          raw as GoogleUserInfo,
          tokenData as GoogleTokenResponse,
        );
      case OAuthProvider.GITHUB:
        return mapGitHubUserInfo(
          raw as GitHubUserInfo,
          tokenData as GithubTokenResponse,
          additionalData?.githubEmails,
        );
      case OAuthProvider.SPOTIFY:
        return mapSpotifyUserInfo(
          raw as SpotifyUserInfo,
          tokenData as SpotifyTokenResponse,
        );
      case OAuthProvider.TWITCH:
        return mapTwitchUserInfo(
          raw as TwitchUserInfo,
          tokenData as TwitchTokenResponse,
        );
      case OAuthProvider.REDDIT:
        return mapRedditUserInfo(
          raw as RedditUserInfo,
          tokenData as RedditTokenResponse,
        );
      default:
        throw new Error(`Unsupported provider: ${provider as string}`);
    }
  }

  public isTokenExpired(): boolean {
    if (!this.expired_at) {
      return false; // Token does not expire
    }
    return new Date() >= this.expired_at;
  }

  public getTokenExpirationInfo(): {
    isExpired: boolean;
    expiresIn: number | null; // in seconds
  } {
    if (!this.expired_at) {
      return { isExpired: false, expiresIn: null };
    }
    const now = new Date();
    const isExpired = now >= this.expired_at;
    const expiresIn = isExpired
      ? 0
      : Math.floor((this.expired_at.getTime() - now.getTime()) / 1000);
    return { isExpired, expiresIn };
  }
}

export function mapDiscordUserInfo(
  raw: DiscordUserInfo,
  tokenData: DiscordTokenResponse,
): OAuth2ResponseDto {
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;
  const scopes = tokenData.scope?.split(' ') ?? [];

  const avatarURL = raw.avatar
    ? `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.${
        raw.avatar.startsWith('a_') ? 'gif' : 'png'
      }`
    : null;

  return new OAuth2ResponseDto({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in ?? null,
    expired_at: expiresAt,
    scopes: scopes,
    id: raw.id,
    email: raw.email ?? null,
    email_verified: raw.verified ?? false,
    name: raw.global_name ?? null,
    username:
      raw.discriminator === '0'
        ? raw.username
        : `${raw.username}#${raw.discriminator}`,
    avatar_url: avatarURL,
    provider: OAuthProvider.DISCORD,
    rawData: raw,
  });
}

export function mapGoogleUserInfo(
  raw: GoogleUserInfo,
  tokenData: GoogleTokenResponse,
): OAuth2ResponseDto {
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;
  const scopes = tokenData.scope?.split(' ') ?? [];

  return new OAuth2ResponseDto({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in ?? null,
    expired_at: expiresAt,
    scopes: scopes,
    id: raw.sub,
    email: raw.email ?? null,
    email_verified: raw.email_verified ?? false,
    name: raw.name ?? null,
    username: null, // Google does not provide a username
    avatar_url: raw.picture ?? null,
    provider: OAuthProvider.GOOGLE,
    rawData: raw,
  });
}

export function mapGitHubUserInfo(
  raw: GitHubUserInfo,
  tokenData: GithubTokenResponse,
  emailsInfo?: GitHubEmailInfo[],
): OAuth2ResponseDto {
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;
  const scopes = tokenData.scope?.split(',').map((s) => s.trim()) ?? [];

  const primaryEmail = emailsInfo?.find((email) => email.primary);

  return new OAuth2ResponseDto({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in ?? null,
    expired_at: expiresAt,
    scopes: scopes,
    id: raw.id.toString(),
    email: primaryEmail?.email ?? raw.email ?? null,
    email_verified: primaryEmail?.verified ?? false,
    name: raw.name ?? null,
    username: raw.login,
    avatar_url: raw.avatar_url ?? null,
    provider: OAuthProvider.GITHUB,
    rawData: raw,
  });
}

export function mapSpotifyUserInfo(
  raw: SpotifyUserInfo,
  tokenData: SpotifyTokenResponse,
): OAuth2ResponseDto {
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;
  const scopes = tokenData.scope?.split(' ') ?? [];

  const avatarURL =
    raw.images && raw.images.length > 0 ? raw.images[0].url : null;

  return new OAuth2ResponseDto({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in ?? null,
    expired_at: expiresAt,
    scopes: scopes,
    id: raw.id,
    email: raw.email ?? null,
    email_verified: false, // Spotify does not provide email verification status
    name: raw.display_name ?? null,
    username: null, // Spotify does not provide a username
    avatar_url: avatarURL,
    provider: OAuthProvider.SPOTIFY,
    rawData: raw,
  });
}

export function mapTwitchUserInfo(
  raw: TwitchUserInfo,
  tokenData: TwitchTokenResponse,
): OAuth2ResponseDto {
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;
  const scopes = tokenData.scope?.split(' ') ?? [];

  return new OAuth2ResponseDto({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in ?? null,
    expired_at: expiresAt,
    scopes: scopes,
    id: raw.id,
    email: raw.email ?? null,
    email_verified: !!raw.email, // Twitch only provides email if verified
    name: raw.display_name,
    username: raw.login,
    avatar_url: raw.profile_image_url,
    provider: OAuthProvider.TWITCH,
    rawData: raw,
  });
}

export function mapRedditUserInfo(
  raw: RedditUserInfo,
  tokenData: RedditTokenResponse,
): OAuth2ResponseDto {
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null;
  const scopes = tokenData.scope?.split(' ') ?? [];

  return new OAuth2ResponseDto({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? null,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in ?? null,
    expired_at: expiresAt,
    scopes: scopes,
    id: raw.id,
    email: null, // Reddit does not provide email via OAuth2
    email_verified: false, // Reddit does not provide email verification status
    name: raw.name,
    username: raw.name,
    avatar_url: raw.icon_img ?? null,
    provider: OAuthProvider.REDDIT,
    rawData: raw,
  });
}
