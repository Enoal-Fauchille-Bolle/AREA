import {
  OAuthProvider,
  isOAuthProvider,
  getOAuthProviderFromString,
  OAuthProviderServiceNameMap,
  isDiscordUserInfo,
  isGoogleUserInfo,
  isGitHubUserInfo,
  isSpotifyUserInfo,
  isTwitchUserInfo,
  createUsernameFromProviderInfo,
  type DiscordUserInfo,
  type GoogleUserInfo,
  type GitHubUserInfo,
  type SpotifyUserInfo,
  type TwitchUserInfo,
} from './oauth-providers.dto';

describe('oauth-providers.dto', () => {
  describe('OAuthProvider enum', () => {
    it('should have all expected providers', () => {
      expect(OAuthProvider.DISCORD).toBe('discord');
      expect(OAuthProvider.GOOGLE).toBe('google');
      expect(OAuthProvider.GMAIL).toBe('gmail');
      expect(OAuthProvider.GITHUB).toBe('github');
      expect(OAuthProvider.SPOTIFY).toBe('spotify');
      expect(OAuthProvider.TWITCH).toBe('twitch');
    });

    it('should have 6 providers', () => {
      const providers = Object.values(OAuthProvider);
      expect(providers.length).toBe(6);
    });
  });

  describe('isOAuthProvider', () => {
    it('should return true for valid providers', () => {
      expect(isOAuthProvider('discord')).toBe(true);
      expect(isOAuthProvider('google')).toBe(true);
      expect(isOAuthProvider('gmail')).toBe(true);
      expect(isOAuthProvider('github')).toBe(true);
      expect(isOAuthProvider('spotify')).toBe(true);
      expect(isOAuthProvider('twitch')).toBe(true);
    });

    it('should return false for invalid providers', () => {
      expect(isOAuthProvider('facebook')).toBe(false);
      expect(isOAuthProvider('twitter')).toBe(false);
      expect(isOAuthProvider('invalid')).toBe(false);
      expect(isOAuthProvider('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isOAuthProvider('Discord')).toBe(false);
      expect(isOAuthProvider('DISCORD')).toBe(false);
    });
  });

  describe('getOAuthProviderFromString', () => {
    it('should return provider for valid lowercase strings', () => {
      expect(getOAuthProviderFromString('discord')).toBe(OAuthProvider.DISCORD);
      expect(getOAuthProviderFromString('google')).toBe(OAuthProvider.GOOGLE);
      expect(getOAuthProviderFromString('gmail')).toBe(OAuthProvider.GMAIL);
      expect(getOAuthProviderFromString('github')).toBe(OAuthProvider.GITHUB);
      expect(getOAuthProviderFromString('spotify')).toBe(OAuthProvider.SPOTIFY);
      expect(getOAuthProviderFromString('twitch')).toBe(OAuthProvider.TWITCH);
    });

    it('should handle uppercase and mixed case strings', () => {
      expect(getOAuthProviderFromString('DISCORD')).toBe(OAuthProvider.DISCORD);
      expect(getOAuthProviderFromString('Discord')).toBe(OAuthProvider.DISCORD);
      expect(getOAuthProviderFromString('GiThUb')).toBe(OAuthProvider.GITHUB);
    });

    it('should return null for invalid providers', () => {
      expect(getOAuthProviderFromString('facebook')).toBeNull();
      expect(getOAuthProviderFromString('invalid')).toBeNull();
      expect(getOAuthProviderFromString('')).toBeNull();
    });
  });

  describe('OAuthProviderServiceNameMap', () => {
    it('should map all providers to display names', () => {
      expect(OAuthProviderServiceNameMap[OAuthProvider.DISCORD]).toBe(
        'Discord',
      );
      expect(OAuthProviderServiceNameMap[OAuthProvider.GOOGLE]).toBe('Google');
      expect(OAuthProviderServiceNameMap[OAuthProvider.GMAIL]).toBe('Gmail');
      expect(OAuthProviderServiceNameMap[OAuthProvider.GITHUB]).toBe('GitHub');
      expect(OAuthProviderServiceNameMap[OAuthProvider.SPOTIFY]).toBe(
        'Spotify',
      );
      expect(OAuthProviderServiceNameMap[OAuthProvider.TWITCH]).toBe('Twitch');
    });

    it('should have entries for all enum values', () => {
      const providers = Object.values(OAuthProvider);
      for (const provider of providers) {
        expect(OAuthProviderServiceNameMap[provider]).toBeDefined();
      }
    });
  });

  describe('isDiscordUserInfo', () => {
    it('should return true for Discord user info', () => {
      const discordUser: DiscordUserInfo = {
        id: '123',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
      };

      expect(isDiscordUserInfo(discordUser)).toBe(true);
    });

    it('should return false for non-Discord user info', () => {
      const googleUser: GoogleUserInfo = {
        sub: '123',
        name: 'Test User',
        email: 'test@example.com',
      };

      expect(isDiscordUserInfo(googleUser)).toBe(false);
    });
  });

  describe('isGoogleUserInfo', () => {
    it('should return true for Google user info', () => {
      const googleUser: GoogleUserInfo = {
        sub: '123',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        email: 'test@example.com',
      };

      expect(isGoogleUserInfo(googleUser)).toBe(true);
    });

    it('should return false for non-Google user info', () => {
      const discordUser: DiscordUserInfo = {
        id: '123',
        username: 'testuser',
        discriminator: '0001',
      };

      expect(isGoogleUserInfo(discordUser)).toBe(false);
    });
  });

  describe('isGitHubUserInfo', () => {
    it('should return true for GitHub user info', () => {
      const githubUser: GitHubUserInfo = {
        id: 123,
        login: 'testuser',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        public_repos: 10,
      };

      expect(isGitHubUserInfo(githubUser)).toBe(true);
    });

    it('should return false for non-GitHub user info', () => {
      const googleUser: GoogleUserInfo = {
        sub: '123',
        name: 'Test User',
      };

      expect(isGitHubUserInfo(googleUser)).toBe(false);
    });
  });

  describe('isSpotifyUserInfo', () => {
    it('should return true for Spotify user info', () => {
      const spotifyUser: SpotifyUserInfo = {
        id: '123',
        display_name: 'Test User',
        email: 'test@example.com',
        product: 'premium',
      };

      expect(isSpotifyUserInfo(spotifyUser)).toBe(true);
    });

    it('should return false for non-Spotify user info', () => {
      const discordUser: DiscordUserInfo = {
        id: '123',
        username: 'testuser',
        discriminator: '0001',
      };

      expect(isSpotifyUserInfo(discordUser)).toBe(false);
    });
  });

  describe('isTwitchUserInfo', () => {
    it('should return true for Twitch user info', () => {
      const twitchUser: TwitchUserInfo = {
        id: '123',
        login: 'testuser',
        display_name: 'TestUser',
        type: '',
        broadcaster_type: 'partner',
        description: 'Test description',
        profile_image_url: 'https://example.com/profile.jpg',
        offline_image_url: 'https://example.com/offline.jpg',
        created_at: '2020-01-01T00:00:00Z',
      };

      expect(isTwitchUserInfo(twitchUser)).toBe(true);
    });

    it('should return false for non-Twitch user info', () => {
      const googleUser: GoogleUserInfo = {
        sub: '123',
        name: 'Test User',
      };

      expect(isTwitchUserInfo(googleUser)).toBe(false);
    });
  });

  describe('createUsernameFromProviderInfo', () => {
    it('should create username from Discord info with discriminator', () => {
      const discordUser: DiscordUserInfo = {
        id: '123',
        username: 'testuser',
        discriminator: '1234',
      };

      expect(createUsernameFromProviderInfo(discordUser)).toBe('testuser#1234');
    });

    it('should create username from Discord info without discriminator (new format)', () => {
      const discordUser: DiscordUserInfo = {
        id: '123',
        username: 'testuser',
        discriminator: '0',
      };

      expect(createUsernameFromProviderInfo(discordUser)).toBe('testuser');
    });

    it('should create username from Discord info with fallback', () => {
      const discordUser: DiscordUserInfo = {
        id: '123',
        username: '',
        discriminator: '0',
      };

      expect(createUsernameFromProviderInfo(discordUser)).toBe(
        'discord_user_123',
      );
    });

    it('should create username from Google info', () => {
      const googleUser: GoogleUserInfo = {
        sub: '123',
        name: 'Test User',
        email: 'test@example.com',
      };

      expect(createUsernameFromProviderInfo(googleUser)).toBe('Test User');
    });

    it('should create username from Google info with fallback', () => {
      const googleUser: GoogleUserInfo = {
        sub: '123',
      };

      expect(createUsernameFromProviderInfo(googleUser)).toBe(
        'google_user_123',
      );
    });

    it('should create username from GitHub info', () => {
      const githubUser: GitHubUserInfo = {
        id: 123,
        login: 'testuser',
        avatar_url: null,
        public_repos: 10,
      };

      expect(createUsernameFromProviderInfo(githubUser)).toBe('testuser');
    });

    it('should create username from GitHub info with fallback', () => {
      const githubUser: GitHubUserInfo = {
        id: 123,
        login: '',
        avatar_url: null,
        public_repos: 10,
      };

      expect(createUsernameFromProviderInfo(githubUser)).toBe(
        'github_user_123',
      );
    });

    it('should create username from Spotify info', () => {
      const spotifyUser: SpotifyUserInfo = {
        id: '123',
        display_name: 'Test User',
        product: 'premium',
      };

      expect(createUsernameFromProviderInfo(spotifyUser)).toBe('Test User');
    });

    it('should create username from Spotify info with fallback', () => {
      const spotifyUser: SpotifyUserInfo = {
        id: '123',
        display_name: null,
        product: 'free',
      };

      expect(createUsernameFromProviderInfo(spotifyUser)).toBe(
        'spotify_user_123',
      );
    });

    it('should create username from Twitch info', () => {
      const twitchUser: TwitchUserInfo = {
        id: '123',
        login: 'testuser',
        display_name: 'TestUser',
        type: '',
        broadcaster_type: '',
        description: '',
        profile_image_url: '',
        offline_image_url: '',
        created_at: '2020-01-01T00:00:00Z',
      };

      expect(createUsernameFromProviderInfo(twitchUser)).toBe('testuser');
    });

    it('should create username from Twitch info with fallback', () => {
      const twitchUser: TwitchUserInfo = {
        id: '123',
        login: '',
        display_name: 'TestUser',
        type: '',
        broadcaster_type: '',
        description: '',
        profile_image_url: '',
        offline_image_url: '',
        created_at: '2020-01-01T00:00:00Z',
      };

      expect(createUsernameFromProviderInfo(twitchUser)).toBe(
        'twitch_user_123',
      );
    });
  });
});
