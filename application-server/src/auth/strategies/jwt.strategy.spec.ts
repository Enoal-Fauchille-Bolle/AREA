/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashed_password',
    is_email_verified: true,
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock config service to return app config
    mockConfigService.get.mockReturnValue({
      jwt: {
        secret: 'test-secret-key',
        expirationTime: '1d',
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error when app config is not loaded', async () => {
      mockConfigService.get.mockReturnValue(null);

      await expect(async () => {
        await Test.createTestingModule({
          providers: [
            JwtStrategy,
            {
              provide: UsersService,
              useValue: mockUsersService,
            },
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
          ],
        }).compile();
      }).rejects.toThrow('App configuration is not properly loaded');
    });

    it('should initialize with correct JWT config', () => {
      expect(configService.get).toHaveBeenCalledWith('app');
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should return user when JWT payload is valid', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser as User);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload: JwtPayload = {
        sub: 999,
        email: 'nonexistent@example.com',
        username: 'nonexistent',
      };

      mockUsersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
      expect(usersService.findOne).toHaveBeenCalledWith(999);
    });

    it('should handle different user IDs correctly', async () => {
      const payload: JwtPayload = {
        sub: 42,
        email: 'another@example.com',
        username: 'anotheruser',
      };

      const anotherUser: Partial<User> = { ...mockUser, id: 42 };
      mockUsersService.findOne.mockResolvedValue(anotherUser as User);

      const result = await strategy.validate(payload);

      expect(result).toEqual(anotherUser);
      expect(usersService.findOne).toHaveBeenCalledWith(42);
    });

    it('should throw UnauthorizedException when user lookup fails', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      mockUsersService.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow();
      expect(usersService.findOne).toHaveBeenCalledWith(1);
    });

    it('should validate payload with all required fields', async () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });
  });
});
