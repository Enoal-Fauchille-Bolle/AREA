/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: {
    login: jest.Mock;
    register: jest.Mock;
    loginWithOAuth2: jest.Mock;
    registerWithOAuth2: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
    deleteProfile: jest.Mock;
    verifyEmail: jest.Mock;
    resendVerificationCode: jest.Mock;
  };
  let mockConfigService: {
    get: jest.Mock;
  };

  const mockAuthResponse = {
    access_token: 'mock-jwt-token',
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  const mockUserResponse = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      loginWithOAuth2: jest.fn(),
      registerWithOAuth2: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationCode: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(() => ({
        oauth2: {
          auth: {
            mobile_redirect_uri: 'myapp://auth/callback',
          },
        },
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return auth response with access token', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const req = {} as any;

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, req);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('loginOAuth2', () => {
    it('should login with OAuth2', async () => {
      const oauthLoginDto = {
        provider: 'discord',
        code: 'oauth-code-123',
        platform: 'web',
        redirect_uri: 'http://localhost:3000/callback',
      } as any;

      mockAuthService.loginWithOAuth2.mockResolvedValue(mockAuthResponse);

      const result = await controller.loginOAuth2(oauthLoginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.loginWithOAuth2).toHaveBeenCalledWith(
        oauthLoginDto,
      );
    });
  });

  describe('registerOAuth2', () => {
    it('should register with OAuth2', async () => {
      const oauthRegisterDto = {
        provider: 'github',
        code: 'oauth-code-456',
        platform: 'web',
        redirect_uri: 'http://localhost:3000/callback',
      } as any;

      mockAuthService.registerWithOAuth2.mockResolvedValue(mockAuthResponse);

      const result = await controller.registerOAuth2(oauthRegisterDto);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.registerWithOAuth2).toHaveBeenCalledWith(
        oauthRegisterDto,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = { user: { id: 1 } };

      mockAuthService.getProfile.mockResolvedValue(mockUserResponse);

      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUserResponse);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const req = { user: { id: 1 } };
      const updateDto = {
        username: 'updateduser',
      };

      mockAuthService.updateProfile.mockResolvedValue({
        ...mockUserResponse,
        username: 'updateduser',
      });

      const result = await controller.updateProfile(req, updateDto);

      expect(result.username).toBe('updateduser');
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile', async () => {
      const req = { user: { id: 1 } };

      mockAuthService.deleteProfile.mockResolvedValue(undefined);

      await controller.deleteProfile(req);

      expect(mockAuthService.deleteProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with code', async () => {
      const verifyDto = {
        email: 'test@example.com',
        code: '123456',
      };

      mockAuthService.verifyEmail.mockResolvedValue({
        message: 'Email verified successfully',
      });

      const result = await controller.verifyEmail(verifyDto);

      expect(result.message).toBe('Email verified successfully');
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(verifyDto);
    });
  });

  describe('resendVerification', () => {
    it('should resend verification code', async () => {
      const resendDto = {
        email: 'test@example.com',
      };

      mockAuthService.resendVerificationCode.mockResolvedValue({
        message: 'Verification code sent',
      });

      const result = await controller.resendVerification(resendDto);

      expect(result.message).toBe('Verification code sent');
      expect(mockAuthService.resendVerificationCode).toHaveBeenCalledWith(
        resendDto,
      );
    });
  });

  describe('oauth2Callback', () => {
    it('should throw BadRequestException when code is missing', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        contentType: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as any;

      expect(() =>
        controller.oauth2Callback('Android', undefined as any, 'discord', res),
      ).toThrow(BadRequestException);
      expect(() =>
        controller.oauth2Callback('Android', undefined as any, 'discord', res),
      ).toThrow('Missing OAuth code');
    });

    it('should throw BadRequestException when provider is missing', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        contentType: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as any;

      expect(() =>
        controller.oauth2Callback('iPhone', 'code123', undefined as any, res),
      ).toThrow(BadRequestException);
      expect(() =>
        controller.oauth2Callback('iPhone', 'code123', undefined as any, res),
      ).toThrow('Missing OAuth provider');
    });

    it('should throw BadRequestException for invalid provider', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        contentType: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as any;

      expect(() =>
        controller.oauth2Callback('iPad', 'code123', 'invalid', res),
      ).toThrow(BadRequestException);
      expect(() =>
        controller.oauth2Callback('iPad', 'code123', 'invalid', res),
      ).toThrow('Invalid OAuth provider');
    });

    it('should return message for non-mobile requests', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        contentType: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as any;

      controller.oauth2Callback('Mozilla', 'code123', 'discord', res);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.status).toHaveBeenCalledWith(400);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.contentType).toHaveBeenCalledWith('text/html');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.send).toHaveBeenCalled();
    });
  });
});
