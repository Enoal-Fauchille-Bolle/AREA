/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GmailOAuth2Service } from './gmail-oauth2.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('GmailOAuth2Service', () => {
  let service: GmailOAuth2Service;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue({
        oauth2: {
          gmail: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          },
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailOAuth2Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GmailOAuth2Service>(GmailOAuth2Service);
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
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
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
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
    });

    it('should include code verifier if provided', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await service.exchangeCodeForTokens(
        'auth-code',
        'http://localhost:3000/callback',
        'code-verifier',
      );

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const bodyParams = new URLSearchParams(fetchCall[1].body);
      expect(bodyParams.get('code_verifier')).toBe('code-verifier');
    });

    it('should throw error when OAuth2 is not configured', async () => {
      mockConfigService.get.mockReturnValue({
        oauth2: { gmail: { clientId: undefined, clientSecret: undefined } },
      });

      const newService = new GmailOAuth2Service(mockConfigService);

      await expect(
        newService.exchangeCodeForTokens(
          'auth-code',
          'http://localhost:3000/callback',
        ),
      ).rejects.toThrow('Gmail OAuth2 is not properly configured');
    });

    it('should throw error on failed token exchange', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid authorization code',
      });

      await expect(
        service.exchangeCodeForTokens(
          'invalid-code',
          'http://localhost:3000/callback',
        ),
      ).rejects.toThrow('Failed to exchange code for tokens');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.refreshAccessToken('test-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresAt: expect.any(Date),
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should throw error when OAuth2 is not configured', async () => {
      mockConfigService.get.mockReturnValue({
        oauth2: { gmail: { clientId: undefined, clientSecret: undefined } },
      });

      const newService = new GmailOAuth2Service(mockConfigService);

      await expect(
        newService.refreshAccessToken('test-refresh-token'),
      ).rejects.toThrow('Gmail OAuth2 is not properly configured');
    });

    it('should throw error on failed token refresh', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'Invalid refresh token',
      });

      await expect(
        service.refreshAccessToken('invalid-refresh-token'),
      ).rejects.toThrow('Failed to refresh access token');
    });

    it('should calculate correct expiration date', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 7200,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const beforeCall = new Date();
      const result = await service.refreshAccessToken('test-refresh-token');
      const afterCall = new Date();

      const expectedExpiry = new Date(beforeCall.getTime() + 7200 * 1000);
      const actualExpiry = result.expiresAt;

      expect(actualExpiry.getTime()).toBeGreaterThanOrEqual(
        expectedExpiry.getTime() - 1000,
      );
      expect(actualExpiry.getTime()).toBeLessThanOrEqual(
        afterCall.getTime() + 7200 * 1000,
      );
    });
  });

  describe('Configuration', () => {
    it('should handle missing app config', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => new GmailOAuth2Service(mockConfigService)).toThrow(
        'App configuration is not properly loaded',
      );
    });

    it('should load configuration successfully', () => {
      const config = {
        oauth2: {
          gmail: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          },
        },
      };

      mockConfigService.get.mockReturnValue(config);

      expect(() => new GmailOAuth2Service(mockConfigService)).not.toThrow();
    });
  });
});
