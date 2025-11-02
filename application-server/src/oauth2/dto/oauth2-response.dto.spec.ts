import {
  OAuth2ResponseDto,
  mapDiscordUserInfo,
  mapGoogleUserInfo,
  mapGitHubUserInfo,
  mapSpotifyUserInfo,
  mapTwitchUserInfo,
} from './oauth2-response.dto';
import {
  OAuthProvider,
  type DiscordUserInfo,
  type GoogleUserInfo,
  type GitHubUserInfo,
  type SpotifyUserInfo,
  type TwitchUserInfo,
  type GitHubEmailInfo,
} from './oauth-providers.dto';

describe('oauth2-response.dto', () => {
  describe('OAuth2ResponseDto', () => {
    describe('constructor', () => {
      it('should create instance with provided data', () => {
        const data = {
          access_token: 'token123',
          refresh_token: 'refresh123',
          token_type: 'Bearer',
          expires_in: 3600,
          expired_at: new Date(),
          scopes: ['email', 'profile'],
          id: '123',
          email: 'test@example.com',
          email_verified: true,
          name: 'Test User',
          username: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg',
          provider: OAuthProvider.DISCORD,
          rawData: { id: '123', username: 'test', discriminator: '0001' },
        };

        const dto = new OAuth2ResponseDto(data);

        expect(dto.access_token).toBe(data.access_token);
        expect(dto.provider).toBe(data.provider);
      });
    });

    describe('isTokenExpired', () => {
      it('should return false when token has not expired', () => {
        const futureDate = new Date(Date.now() + 3600 * 1000);
        const dto = new OAuth2ResponseDto({
          access_token: 'token',
          refresh_token: null,
          token_type: 'Bearer',
          expires_in: 3600,
          expired_at: futureDate,
          scopes: [],
          id: '123',
          email: null,
          email_verified: false,
          name: null,
          username: null,
          avatar_url: null,
          provider: OAuthProvider.DISCORD,
          rawData: { id: '123', username: 'test', discriminator: '0001' },
        });

        expect(dto.isTokenExpired()).toBe(false);
      });

      it('should return true when token has expired', () => {
        const pastDate = new Date(Date.now() - 3600 * 1000);
        const dto = new OAuth2ResponseDto({
          access_token: 'token',
          refresh_token: null,
          token_type: 'Bearer',
          expires_in: 3600,
          expired_at: pastDate,
          scopes: [],
          id: '123',
          email: null,
          email_verified: false,
          name: null,
          username: null,
          avatar_url: null,
          provider: OAuthProvider.DISCORD,
          rawData: { id: '123', username: 'test', discriminator: '0001' },
        });

        expect(dto.isTokenExpired()).toBe(true);
      });

      it('should return false when expired_at is null', () => {
        const dto = new OAuth2ResponseDto({
          access_token: 'token',
          refresh_token: null,
          token_type: 'Bearer',
          expires_in: null,
          expired_at: null,
          scopes: [],
          id: '123',
          email: null,
          email_verified: false,
          name: null,
          username: null,
          avatar_url: null,
          provider: OAuthProvider.DISCORD,
          rawData: { id: '123', username: 'test', discriminator: '0001' },
        });

        expect(dto.isTokenExpired()).toBe(false);
      });
    });

    describe('getTokenExpirationInfo', () => {
      it('should return expiration info for valid token', () => {
        const futureDate = new Date(Date.now() + 3600 * 1000);
        const dto = new OAuth2ResponseDto({
          access_token: 'token',
          refresh_token: null,
          token_type: 'Bearer',
          expires_in: 3600,
          expired_at: futureDate,
          scopes: [],
          id: '123',
          email: null,
          email_verified: false,
          name: null,
          username: null,
          avatar_url: null,
          provider: OAuthProvider.DISCORD,
          rawData: { id: '123', username: 'test', discriminator: '0001' },
        });

        const info = dto.getTokenExpirationInfo();
        expect(info.isExpired).toBe(false);
        expect(info.expiresIn).toBeGreaterThan(3550);
        expect(info.expiresIn).toBeLessThanOrEqual(3600);
      });

      it('should return expiration info for expired token', () => {
        const pastDate = new Date(Date.now() - 3600 * 1000);
        const dto = new OAuth2ResponseDto({
          access_token: 'token',
          refresh_token: null,
          token_type: 'Bearer',
          expires_in: 3600,
          expired_at: pastDate,
          scopes: [],
          id: '123',
          email: null,
          email_verified: false,
          name: null,
          username: null,
          avatar_url: null,
          provider: OAuthProvider.DISCORD,
          rawData: { id: '123', username: 'test', discriminator: '0001' },
        });

        const info = dto.getTokenExpirationInfo();
        expect(info.isExpired).toBe(true);
        expect(info.expiresIn).toBe(0);
      });

      it('should return null expiresIn when expired_at is null', () => {
        const dto = new OAuth2ResponseDto({
          access_token: 'token',
          refresh_token: null,
          token_type: 'Bearer',
          expires_in: null,
          expired_at: null,
          scopes: [],
          id: '123',
          email: null,
          email_verified: false,
          name: null,
          username: null,
          avatar_url: null,
          provider: OAuthProvider.DISCORD,
          rawData: { id: '123', username: 'test', discriminator: '0001' },
        });

        const info = dto.getTokenExpirationInfo();
        expect(info.isExpired).toBe(false);
        expect(info.expiresIn).toBeNull();
      });
    });

    describe('fromProviderData', () => {
      it('should throw error for unsupported provider', () => {
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        const raw = { id: '123' } as any;
        const tokenData = {
          access_token: 'token',
          token_type: 'Bearer',
        } as any;
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */

        expect(() => {
          /* eslint-disable @typescript-eslint/no-unsafe-argument */
          OAuth2ResponseDto.fromProviderData('invalid' as any, raw, tokenData);
          /* eslint-enable @typescript-eslint/no-unsafe-argument */
        }).toThrow('Unsupported provider');
      });
    });
  });

  describe('mapDiscordUserInfo', () => {
    it('should map Discord user info correctly', () => {
      const raw: DiscordUserInfo = {
        id: '123456789',
        username: 'testuser',
        discriminator: '1234',
        global_name: 'Test User',
        avatar: 'abc123',
        email: 'test@example.com',
        verified: true,
      };

      const tokenData = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'identify email',
      };

      const result = mapDiscordUserInfo(raw, tokenData);

      expect(result.id).toBe('123456789');
      expect(result.username).toBe('testuser#1234');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(result.email_verified).toBe(true);
      expect(result.provider).toBe(OAuthProvider.DISCORD);
      expect(result.scopes).toEqual(['identify', 'email']);
      expect(result.avatar_url).toContain('cdn.discordapp.com');
    });

    it('should handle Discord user without discriminator', () => {
      const raw: DiscordUserInfo = {
        id: '123',
        username: 'testuser',
        discriminator: '0',
        avatar: null,
      };

      const tokenData = {
        access_token: 'token',
        token_type: 'Bearer',
      };

      const result = mapDiscordUserInfo(raw, tokenData);

      expect(result.username).toBe('testuser');
      expect(result.avatar_url).toBeNull();
    });

    it('should handle animated avatar', () => {
      const raw: DiscordUserInfo = {
        id: '123',
        username: 'test',
        discriminator: '0001',
        avatar: 'a_animated123',
      };

      const tokenData = { access_token: 'token', token_type: 'Bearer' };

      const result = mapDiscordUserInfo(raw, tokenData);

      expect(result.avatar_url).toContain('.gif');
    });
  });

  describe('mapGoogleUserInfo', () => {
    it('should map Google user info correctly', () => {
      const raw: GoogleUserInfo = {
        sub: 'google123',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/picture.jpg',
        email: 'test@gmail.com',
        email_verified: true,
      };

      const tokenData = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid email profile',
        id_token: 'idtoken123',
      };

      const result = mapGoogleUserInfo(raw, tokenData);

      expect(result.id).toBe('google123');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@gmail.com');
      expect(result.email_verified).toBe(true);
      expect(result.username).toBeNull();
      expect(result.provider).toBe(OAuthProvider.GOOGLE);
      expect(result.scopes).toEqual(['openid', 'email', 'profile']);
    });
  });

  describe('mapGitHubUserInfo', () => {
    it('should map GitHub user info correctly', () => {
      const raw: GitHubUserInfo = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@github.com',
        avatar_url: 'https://avatars.github.com/u/12345',
        bio: 'Test bio',
      };

      const tokenData = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user,repo',
      };

      const emails: GitHubEmailInfo[] = [
        {
          email: 'primary@github.com',
          primary: true,
          verified: true,
          visibility: 'public',
        },
      ];

      const result = mapGitHubUserInfo(raw, tokenData, emails);

      expect(result.id).toBe('12345');
      expect(result.username).toBe('testuser');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('primary@github.com');
      expect(result.email_verified).toBe(true);
      expect(result.provider).toBe(OAuthProvider.GITHUB);
      expect(result.scopes).toEqual(['user', 'repo']);
    });

    it('should handle GitHub user without email info', () => {
      const raw: GitHubUserInfo = {
        id: 12345,
        login: 'testuser',
        avatar_url: null,
      };

      const tokenData = {
        access_token: 'token',
        token_type: 'Bearer',
      };

      const result = mapGitHubUserInfo(raw, tokenData);

      expect(result.email).toBeNull();
      expect(result.email_verified).toBe(false);
    });
  });

  describe('mapSpotifyUserInfo', () => {
    it('should map Spotify user info correctly', () => {
      const raw: SpotifyUserInfo = {
        id: 'spotify123',
        display_name: 'Test User',
        email: 'test@spotify.com',
        images: [{ url: 'https://i.scdn.co/image/abc', height: 64, width: 64 }],
        product: 'premium',
      };

      const tokenData = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user-read-email user-read-private',
      };

      const result = mapSpotifyUserInfo(raw, tokenData);

      expect(result.id).toBe('spotify123');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@spotify.com');
      expect(result.email_verified).toBe(false);
      expect(result.username).toBeNull();
      expect(result.avatar_url).toBe('https://i.scdn.co/image/abc');
      expect(result.provider).toBe(OAuthProvider.SPOTIFY);
    });

    it('should handle Spotify user without images', () => {
      const raw: SpotifyUserInfo = {
        id: 'spotify123',
        display_name: null,
      };

      const tokenData = { access_token: 'token', token_type: 'Bearer' };

      const result = mapSpotifyUserInfo(raw, tokenData);

      expect(result.avatar_url).toBeNull();
      expect(result.name).toBeNull();
    });
  });

  describe('mapTwitchUserInfo', () => {
    it('should map Twitch user info correctly', () => {
      const raw: TwitchUserInfo = {
        id: 'twitch123',
        login: 'testuser',
        display_name: 'TestUser',
        type: '',
        broadcaster_type: 'partner',
        description: 'Test streamer',
        profile_image_url: 'https://static-cdn.jtvnw.net/user.jpg',
        offline_image_url: 'https://static-cdn.jtvnw.net/offline.jpg',
        email: 'test@twitch.tv',
        created_at: '2020-01-01T00:00:00Z',
      };

      const tokenData = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user:read:email',
      };

      const result = mapTwitchUserInfo(raw, tokenData);

      expect(result.id).toBe('twitch123');
      expect(result.username).toBe('testuser');
      expect(result.name).toBe('TestUser');
      expect(result.email).toBe('test@twitch.tv');
      expect(result.email_verified).toBe(true);
      expect(result.avatar_url).toBe('https://static-cdn.jtvnw.net/user.jpg');
      expect(result.provider).toBe(OAuthProvider.TWITCH);
    });

    it('should handle Twitch user without email', () => {
      const raw: TwitchUserInfo = {
        id: 'twitch123',
        login: 'testuser',
        display_name: 'TestUser',
        type: '',
        broadcaster_type: '',
        description: '',
        profile_image_url: '',
        offline_image_url: '',
        created_at: '2020-01-01T00:00:00Z',
      };

      const tokenData = { access_token: 'token', token_type: 'Bearer' };

      const result = mapTwitchUserInfo(raw, tokenData);

      expect(result.email).toBeNull();
      expect(result.email_verified).toBe(false);
    });
  });
});
