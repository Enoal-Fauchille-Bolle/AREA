/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwitchOAuth2Service } from './twitch-oauth2.service';
import { BadRequestException } from '@nestjs/common';

// Mock fetch globally
global.fetch = jest.fn();

describe('TwitchOAuth2Service', () => {
  let service: TwitchOAuth2Service;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue({
        oauth2: {
          twitch: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          },
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitchOAuth2Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TwitchOAuth2Service>(TwitchOAuth2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: ['user:read:email'],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.exchangeCodeForTokens(
        'auth-code',
        'http://localhost:3000/callback',
      );

      expect(result).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: expect.any(Date),
      });
    });

    it('should handle missing refresh token', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        scope: ['user:read:email'],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.exchangeCodeForTokens(
        'auth-code',
        'http://localhost:3000/callback',
      );

      expect(result.refreshToken).toBeNull();
    });

    it('should throw BadRequestException when not configured', async () => {
      mockConfigService.get.mockReturnValue({
        oauth2: { twitch: { clientId: undefined, clientSecret: undefined } },
      });

      const newService = new TwitchOAuth2Service(mockConfigService);

      await expect(
        newService.exchangeCodeForTokens(
          'auth-code',
          'http://localhost:3000/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error on failed exchange', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid authorization code',
      });

      await expect(
        service.exchangeCodeForTokens(
          'invalid-code',
          'http://localhost:3000/callback',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserInfo', () => {
    it('should get user info successfully', async () => {
      const mockUserData = {
        id: '12345',
        login: 'testuser',
        display_name: 'Test User',
        type: 'user',
        broadcaster_type: '',
        description: 'Test description',
        profile_image_url: 'https://example.com/image.png',
        offline_image_url: '',
        view_count: 0,
        created_at: '2020-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [mockUserData] }),
      });

      const result = await service.getUserInfo('test-access-token');

      expect(result).toEqual(mockUserData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'Client-Id': 'test-client-id',
          }),
        }),
      );
    });

    it('should throw error when no user data returned', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await expect(service.getUserInfo('test-access-token')).rejects.toThrow(
        'No user data returned from Twitch',
      );
    });

    it('should throw error on failed API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(service.getUserInfo('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token',
        scope: ['user:read:email'],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.refreshAccessToken('test-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: expect.any(Date),
      });
    });

    it('should use old refresh token if new one not provided', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        scope: ['user:read:email'],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.refreshAccessToken('old-refresh-token');

      expect(result.refreshToken).toBe('old-refresh-token');
    });

    it('should throw error on failed refresh', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid refresh token',
      });

      await expect(service.refreshAccessToken('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const result = await service.validateToken('valid-token');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/validate',
        expect.objectContaining({
          headers: {
            Authorization: 'OAuth valid-token',
          },
        }),
      );
    });

    it('should return false for invalid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const result = await service.validateToken('invalid-token');

      expect(result).toBe(false);
    });

    it('should return false on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.validateToken('token');

      expect(result).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should handle missing app config', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => new TwitchOAuth2Service(mockConfigService)).toThrow(
        'App configuration is not properly loaded',
      );
    });

    it('should load configuration with preview', () => {
      const config = {
        oauth2: {
          twitch: {
            clientId: 'very-long-client-id-for-preview',
            clientSecret: 'test-secret',
          },
        },
      };

      mockConfigService.get.mockReturnValue(config);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      new TwitchOAuth2Service(mockConfigService);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TwitchOAuth2Service] Configuration loaded:',
        expect.objectContaining({
          hasClientId: true,
          hasClientSecret: true,
        }),
      );

      consoleSpy.mockRestore();
    });
  });
});
