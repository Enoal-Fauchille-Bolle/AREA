/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OAuth2Service } from './oauth2.service';
import { OAuthProvider } from './dto/oauth-providers.dto';
import { of, throwError } from 'rxjs';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

describe('OAuth2Service', () => {
  let service: OAuth2Service;
  let mockHttpService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key) => {
        if (key === 'app') {
          return {
            oauth2: {
              discord: {
                clientId: 'discord-id',
                clientSecret: 'discord-secret',
              },
              google: { clientId: 'google-id', clientSecret: 'google-secret' },
              gmail: { clientId: 'gmail-id', clientSecret: 'gmail-secret' },
              github: { clientId: 'github-id', clientSecret: 'github-secret' },
              spotify: {
                clientId: 'spotify-id',
                clientSecret: 'spotify-secret',
              },
              twitch: { clientId: 'twitch-id', clientSecret: 'twitch-secret' },
            },
          };
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuth2Service,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OAuth2Service>(OAuth2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exchangeCodeForTokens', () => {
    const dto = {
      provider: OAuthProvider.GOOGLE,
      code: 'auth-code',
      redirect_uri: 'http://localhost/callback',
    };

    it('should exchange code for tokens successfully', async () => {
      const tokenResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      };

      mockHttpService.post.mockReturnValue(of({ data: tokenResponse }));

      const result = await service.exchangeCodeForTokens(dto);

      expect(result).toEqual(tokenResponse);
      expect(mockHttpService.post).toHaveBeenCalled();
    });

    it('should throw BadRequestException for missing credentials', async () => {
      const badConfig = {
        get: jest.fn((key) => {
          if (key === 'app') {
            return {
              oauth2: {
                discord: { clientId: undefined, clientSecret: undefined },
                google: { clientId: undefined, clientSecret: undefined },
                gmail: { clientId: undefined, clientSecret: undefined },
                github: { clientId: undefined, clientSecret: undefined },
                spotify: { clientId: undefined, clientSecret: undefined },
                twitch: { clientId: undefined, clientSecret: undefined },
              },
            };
          }
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const newService = new OAuth2Service(mockHttpService, badConfig as any);

      await expect(newService.exchangeCodeForTokens(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle axios error with error details', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: 'invalid_grant',
            error_description: 'Code expired',
          },
        },
        message: 'Request failed',
      };

      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(service.exchangeCodeForTokens(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle generic errors', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.exchangeCodeForTokens(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('refreshAccessToken', () => {
    const dto = {
      provider: OAuthProvider.GOOGLE,
      refresh_token: 'refresh-token',
    };

    it('should refresh access token successfully', async () => {
      const tokenResponse = {
        access_token: 'new-access-token',
        expires_in: 3600,
      };

      mockHttpService.post.mockReturnValue(of({ data: tokenResponse }));

      const result = await service.refreshAccessToken(dto);

      expect(result).toEqual(tokenResponse);
    });

    it('should throw BadRequestException for invalid refresh token', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: { error: 'invalid_grant' },
        },
        message: 'Invalid token',
      };

      mockHttpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(service.refreshAccessToken(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle non-axios errors', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => 'Unknown error'));

      await expect(service.refreshAccessToken(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserInfo', () => {
    it('should get Discord user info', async () => {
      const userInfo = { id: '12345', username: 'testuser' };
      mockHttpService.get.mockReturnValue(of({ data: userInfo }));

      const result = await service.getUserInfo(
        OAuthProvider.DISCORD,
        'access-token',
      );

      expect(result).toEqual(userInfo);
    });

    it('should get Google user info', async () => {
      const userInfo = { sub: '12345', email: 'test@gmail.com' };
      mockHttpService.get.mockReturnValue(of({ data: userInfo }));

      const result = await service.getUserInfo(
        OAuthProvider.GOOGLE,
        'access-token',
      );

      expect(result).toEqual(userInfo);
    });

    it('should get GitHub user info', async () => {
      const userInfo = { id: 12345, login: 'testuser' };
      mockHttpService.get.mockReturnValue(of({ data: userInfo }));

      const result = await service.getUserInfo(
        OAuthProvider.GITHUB,
        'access-token',
      );

      expect(result).toEqual(userInfo);
    });

    it('should get Spotify user info', async () => {
      const userInfo = { id: '12345', display_name: 'Test User' };
      mockHttpService.get.mockReturnValue(of({ data: userInfo }));

      const result = await service.getUserInfo(
        OAuthProvider.SPOTIFY,
        'access-token',
      );

      expect(result).toEqual(userInfo);
    });

    it('should get Twitch user info', async () => {
      const userInfo = {
        data: [{ id: '12345', login: 'testuser' }],
      };
      mockHttpService.get.mockReturnValue(of({ data: userInfo }));

      const result = await service.getUserInfo(
        OAuthProvider.TWITCH,
        'access-token',
      );

      expect(result).toEqual({ id: '12345', login: 'testuser' });
    });

    it('should throw UnauthorizedException for 401 errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
        message: 'Unauthorized',
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.getUserInfo(OAuthProvider.DISCORD, 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for other errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Bad request' },
        },
        message: 'Bad request',
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.getUserInfo(OAuthProvider.GOOGLE, 'token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for unsupported provider', async () => {
      await expect(
        service.getUserInfo('INVALID' as OAuthProvider, 'token'),
      ).rejects.toThrow();
    });

    it('should throw InternalServerErrorException when Twitch returns no users', async () => {
      mockHttpService.get.mockReturnValue(of({ data: { data: [] } }));

      await expect(
        service.getUserInfo(OAuthProvider.TWITCH, 'token'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('exchangeCodeAndGetUserInfo', () => {
    it('should exchange code and get user info', async () => {
      const dto = {
        provider: OAuthProvider.GOOGLE,
        code: 'auth-code',
        redirect_uri: 'http://localhost/callback',
      };

      const tokenResponse = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      const userInfo = { sub: '12345', email: 'test@gmail.com' };

      mockHttpService.post.mockReturnValue(of({ data: tokenResponse }));
      mockHttpService.get.mockReturnValue(of({ data: userInfo }));

      const result = await service.exchangeCodeAndGetUserInfo(dto);

      expect(result).toBeDefined();
    });

    it('should get GitHub emails for GitHub provider', async () => {
      const dto = {
        provider: OAuthProvider.GITHUB,
        code: 'auth-code',
        redirect_uri: 'http://localhost/callback',
      };

      const tokenResponse = { access_token: 'access-token' };
      const userInfo = { id: 12345, login: 'testuser' };
      const emails = [{ email: 'test@github.com', primary: true }];

      mockHttpService.post.mockReturnValue(of({ data: tokenResponse }));
      mockHttpService.get
        .mockReturnValueOnce(of({ data: userInfo }))
        .mockReturnValueOnce(of({ data: emails }));

      const result = await service.exchangeCodeAndGetUserInfo(dto);

      expect(result).toBeDefined();
    });
  });

  describe('refreshTokenAndGetUserInfo', () => {
    it('should refresh token and get user info', async () => {
      const dto = {
        provider: OAuthProvider.GOOGLE,
        refresh_token: 'refresh-token',
      };

      const tokenResponse = { access_token: 'new-access-token' };
      const userInfo = { sub: '12345', email: 'test@gmail.com' };

      mockHttpService.post.mockReturnValue(of({ data: tokenResponse }));
      mockHttpService.get.mockReturnValue(of({ data: userInfo }));

      const result = await service.refreshTokenAndGetUserInfo(dto);

      expect(result).toBeDefined();
    });
  });
});
