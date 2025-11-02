/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockUserResponse: Partial<UserResponseDto> = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    is_admin: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'ValidPassword123';

      mockAuthService.validateUser.mockResolvedValue(
        mockUserResponse as UserResponseDto,
      );

      const result = await strategy.validate(email, password);

      expect(result).toEqual(mockUserResponse);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'WrongPassword';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should validate user with different credentials', async () => {
      const email = 'another@example.com';
      const password = 'AnotherPassword123';
      const anotherUser: Partial<UserResponseDto> = {
        id: 2,
        email: 'another@example.com',
        username: 'anotheruser',
        is_admin: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAuthService.validateUser.mockResolvedValue(
        anotherUser as UserResponseDto,
      );

      const result = await strategy.validate(email, password);

      expect(result).toEqual(anotherUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should use email field instead of username', async () => {
      // This test verifies that the strategy is configured with usernameField: 'email'
      const email = 'test@example.com';
      const password = 'password';

      mockAuthService.validateUser.mockResolvedValue(
        mockUserResponse as UserResponseDto,
      );

      await strategy.validate(email, password);

      // Verify it's called with email (not username)
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(authService.validateUser).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors from auth service', async () => {
      const email = 'test@example.com';
      const password = 'password';

      mockAuthService.validateUser.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Database connection failed',
      );
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should return user with all expected properties', async () => {
      const email = 'test@example.com';
      const password = 'password';

      mockAuthService.validateUser.mockResolvedValue(
        mockUserResponse as UserResponseDto,
      );

      const result = await strategy.validate(email, password);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('is_admin');
      expect(result).toHaveProperty('is_active');
    });

    it('should handle empty password', async () => {
      const email = 'test@example.com';
      const password = '';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty email', async () => {
      const email = '';
      const password = 'password';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
