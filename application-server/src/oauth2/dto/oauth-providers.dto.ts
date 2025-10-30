import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsUrl } from 'class-validator';

export enum OAuthProvider {
  DISCORD = 'discord',
  GOOGLE = 'google',
  GMAIL = 'gmail',
  GITHUB = 'github',
  SPOTIFY = 'spotify',
  TWITCH = 'twitch',
  REDDIT = 'reddit',
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return Object.values(OAuthProvider).includes(value as OAuthProvider);
}

export function getOAuthProviderFromString(
  value: string,
): OAuthProvider | null {
  value = value.toLowerCase();
  if (isOAuthProvider(value)) {
    return value;
  }
  return null;
}

export const OAuthProviderServiceNameMap: Record<OAuthProvider, string> = {
  [OAuthProvider.DISCORD]: 'Discord',
  [OAuthProvider.GOOGLE]: 'Google',
  [OAuthProvider.GMAIL]: 'Gmail',
  [OAuthProvider.GITHUB]: 'GitHub',
  [OAuthProvider.SPOTIFY]: 'Spotify',
  [OAuthProvider.TWITCH]: 'Twitch',
  [OAuthProvider.REDDIT]: 'Reddit',
};

export class ExchangeOAuthCodeDto {
  @ApiProperty({
    description: 'Authorization code received from the OAuth provider',
    example: 'SplxlOBeZQQYbYS6WxSbIA',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The OAuth provider to exchange the code with',
    enum: OAuthProvider,
    example: OAuthProvider.DISCORD,
  })
  @IsEnum(OAuthProvider)
  @IsNotEmpty()
  provider: OAuthProvider;

  @ApiProperty({
    description: 'The redirect URI used in the OAuth flow',
    example: 'https://yourapp.com/oauth/callback',
  })
  @IsUrl()
  @IsNotEmpty()
  redirect_uri: string;

  constructor(data: ExchangeOAuthCodeDto) {
    Object.assign(this, data);
  }
}

export class RefreshOAuthTokenDto {
  @ApiProperty({
    description: 'The refresh token received from the OAuth provider',
    example: 'd1f2e3a4b5c6d7e8f9g0',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @ApiProperty({
    description: 'The OAuth provider to refresh the token for',
    enum: OAuthProvider,
    example: OAuthProvider.GOOGLE,
  })
  @IsEnum(OAuthProvider)
  @IsNotEmpty()
  provider: OAuthProvider;

  constructor(data: RefreshOAuthTokenDto) {
    Object.assign(this, data);
  }
}

export class OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

export class DiscordTokenResponse extends OAuthTokenResponse {}

export class GoogleTokenResponse extends OAuthTokenResponse {
  id_token?: string;
}

export class GithubTokenResponse extends OAuthTokenResponse {}

export class SpotifyTokenResponse extends OAuthTokenResponse {}

export class TwitchTokenResponse extends OAuthTokenResponse {}

export class RedditTokenResponse extends OAuthTokenResponse {}

export type ProviderTokenResponse =
  | DiscordTokenResponse
  | GoogleTokenResponse
  | GithubTokenResponse
  | SpotifyTokenResponse
  | TwitchTokenResponse
  | RedditTokenResponse;

export class DiscordUserInfo {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export class GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
}

export class GitHubUserInfo {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  hireable?: boolean | null;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at?: string;
}

// GitHub requires a separate API call to get verified email info
export class GitHubEmailInfo {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: 'public' | 'private' | null;
}

export class SpotifyUserInfo {
  id: string;
  display_name?: string | null;
  email?: string | null;
  country?: string | null;
  explicit_content?: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  external_urls?: {
    spotify: string;
  };
  followers?: {
    href: string | null;
    total: number;
  };
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  product?: 'premium' | 'free' | 'open' | null;
  type?: string;
  uri?: string;
}

export class TwitchUserInfo {
  id: string;
  login: string; // Username
  display_name: string;
  type: '' | 'admin' | 'staff' | 'global_mod';
  broadcaster_type: '' | 'affiliate' | 'partner';
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  email?: string;
  created_at: string;
}

export class RedditUserInfo {
  id: string;
  name: string;
  created_at: string;
  icon_img: string;
  banner_img: string;
  is_employee: boolean;
  is_mod: boolean;
  is_suspended: boolean;
  verified: boolean;
  subreddit: {
    id: string;
    name: string;
    created_at: string;
    icon_img: string;
    banner_img: string;
    subscribers: number;
  };
}

export type ProviderUserInfo =
  | DiscordUserInfo
  | GoogleUserInfo
  | GitHubUserInfo
  | SpotifyUserInfo
  | TwitchUserInfo
  | RedditUserInfo;

export function isDiscordUserInfo(
  data: ProviderUserInfo,
): data is DiscordUserInfo {
  return 'discriminator' in data && 'global_name' in data;
}

export function isGoogleUserInfo(
  data: ProviderUserInfo,
): data is GoogleUserInfo {
  return 'sub' in data && 'given_name' in data;
}

export function isGitHubUserInfo(
  data: ProviderUserInfo,
): data is GitHubUserInfo {
  return 'avatar_url' in data && 'public_repos' in data;
}

export function isSpotifyUserInfo(
  data: ProviderUserInfo,
): data is SpotifyUserInfo {
  return 'display_name' in data && 'product' in data;
}

export function isTwitchUserInfo(
  data: ProviderUserInfo,
): data is TwitchUserInfo {
  return 'broadcaster_type' in data && 'offline_image_url' in data;
}

export function isRedditUserInfo(
  data: ProviderUserInfo,
): data is RedditUserInfo {
  return 'id' in data && 'name' in data && 'subreddit' in data;
}

export function createUsernameFromProviderInfo(
  data: ProviderUserInfo,
): string | null {
  if (isDiscordUserInfo(data)) {
    return (
      (data.discriminator && data.discriminator === '0'
        ? data.username
        : `${data.username}#${data.discriminator}`) || 'discord_user_' + data.id
    );
  } else if (isGoogleUserInfo(data)) {
    return data.name || 'google_user_' + data.sub;
  } else if (isGitHubUserInfo(data)) {
    return data.login || 'github_user_' + data.id;
  } else if (isSpotifyUserInfo(data)) {
    return data.display_name || 'spotify_user_' + data.id;
  } else if (isTwitchUserInfo(data)) {
    return data.login || 'twitch_user_' + data.id;
  } else if (isRedditUserInfo(data)) {
    return data.name || 'reddit_user_' + data.id;
  } else {
    return null;
  }
}
