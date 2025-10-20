import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { DiscordOAuth2Service } from './discord-oauth2.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('DiscordOAuth2Service', () => {
  let service: DiscordOAuth2Service;

  const mockConfigService = {
    get: jest.fn().mockReturnValue({
      oauth2: {
        discord: {
          clientId: 'test_client_id',
          clientSecret: 'test_client_secret',
          redirectUri: 'http://localhost:8080/callback',
        },
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordOAuth2Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DiscordOAuth2Service>(DiscordOAuth2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exchangeCodeForTokens', () => {
    const mockDiscordResponse = {
      access_token: 'mock_access_token_123',
      token_type: 'Bearer',
      expires_in: 604800,
      refresh_token: 'mock_refresh_token_456',
      scope: 'identify email guilds',
    };

    it('should successfully exchange authorization code for tokens', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDiscordResponse),
      });

      const result = await service.exchangeCodeForTokens(
        'auth_code_123',
        'http://localhost:8080/callback',
      );

      expect(result.accessToken).toBe('mock_access_token_123');
      expect(result.refreshToken).toBe('mock_refresh_token_456');
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Check that the expiration time is approximately correct (within 5 seconds)
      const expectedExpiresAt = new Date();
      expectedExpiresAt.setSeconds(expectedExpiresAt.getSeconds() + 604800);
      const timeDiff = Math.abs(
        result.expiresAt.getTime() - expectedExpiresAt.getTime(),
      );
      expect(timeDiff).toBeLessThan(5000);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      // Verify the request body contains correct parameters
      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = (callArgs[1] as { body: URLSearchParams }).body;
      expect(body.get('client_id')).toBe('test_client_id');
      expect(body.get('client_secret')).toBe('test_client_secret');
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('auth_code_123');
      expect(body.get('redirect_uri')).toBe('http://localhost:8080/callback');
    });

    it('should throw BadRequestException when Discord API returns error', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Invalid authorization code'),
      });

      await expect(
        service.exchangeCodeForTokens(
          'invalid_code',
          'http://localhost:8080/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when fetch throws error', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.exchangeCodeForTokens('auth_code_123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when Discord OAuth2 is not configured', async () => {
      const unconfiguredService = {
        get: jest.fn().mockReturnValue({
          oauth2: {
            discord: {
              clientId: undefined,
              clientSecret: undefined,
              redirectUri: 'http://localhost:8080/callback',
            },
          },
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DiscordOAuth2Service,
          {
            provide: ConfigService,
            useValue: unconfiguredService,
          },
        ],
      }).compile();

      const unconfiguredDiscordService =
        module.get<DiscordOAuth2Service>(DiscordOAuth2Service);

      await expect(
        unconfiguredDiscordService.exchangeCodeForTokens(
          'auth_code_123',
          'http://localhost:8080/callback',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        unconfiguredDiscordService.exchangeCodeForTokens(
          'auth_code_123',
          'http://localhost:8080/callback',
        ),
      ).rejects.toThrow('Discord OAuth2 is not configured');
    });
  });

  describe('refreshAccessToken', () => {
    const mockDiscordRefreshResponse = {
      access_token: 'new_access_token_789',
      token_type: 'Bearer',
      expires_in: 604800,
      refresh_token: 'new_refresh_token_012',
      scope: 'identify email guilds',
    };

    it('should successfully refresh access token', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDiscordRefreshResponse),
      });

      const result = await service.refreshAccessToken('old_refresh_token');

      expect(result.accessToken).toBe('new_access_token_789');
      expect(result.refreshToken).toBe('new_refresh_token_012');
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Check that the expiration time is approximately correct
      const expectedExpiresAt = new Date();
      expectedExpiresAt.setSeconds(expectedExpiresAt.getSeconds() + 604800);
      const timeDiff = Math.abs(
        result.expiresAt.getTime() - expectedExpiresAt.getTime(),
      );
      expect(timeDiff).toBeLessThan(5000);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      // Verify the request body contains correct parameters
      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = (callArgs[1] as { body: URLSearchParams }).body;
      expect(body.get('client_id')).toBe('test_client_id');
      expect(body.get('client_secret')).toBe('test_client_secret');
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('old_refresh_token');
    });

    it('should throw BadRequestException when Discord API returns error on refresh', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Invalid refresh token'),
      });

      await expect(
        service.refreshAccessToken('invalid_refresh_token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when fetch throws error on refresh', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(service.refreshAccessToken('refresh_token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when Discord OAuth2 is not configured for refresh', async () => {
      const unconfiguredService = {
        get: jest.fn().mockReturnValue({
          oauth2: {
            discord: {
              clientId: undefined,
              clientSecret: undefined,
              redirectUri: 'http://localhost:8080/callback',
            },
          },
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DiscordOAuth2Service,
          {
            provide: ConfigService,
            useValue: unconfiguredService,
          },
        ],
      }).compile();

      const unconfiguredDiscordService =
        module.get<DiscordOAuth2Service>(DiscordOAuth2Service);

      await expect(
        unconfiguredDiscordService.refreshAccessToken('refresh_token'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        unconfiguredDiscordService.refreshAccessToken('refresh_token'),
      ).rejects.toThrow('Discord OAuth2 is not configured');
    });
  });
});
