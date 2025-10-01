import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  ConflictException,
  // UnauthorizedException,
} from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let _usersService: UsersService;
  let _jwtService: JwtService;
  let _userRepository: Repository<User>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashedPassword',
    icon_path: null,
    is_admin: false,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_connection_at: new Date(),
  };

  const mockUserRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateLastConnection: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _usersService = module.get<UsersService>(UsersService);
    _jwtService = module.get<JwtService>(JwtService);
    _userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset mocks
    jest.clearAllMocks();
    mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt.token.here');

      const result = await service.register(registerDto);

      expect(result).toEqual({ token: 'jwt.token.here' });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
      // AuthService doesn't hash password directly - UsersService does
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        username: registerDto.username,
        password: registerDto.password, // Raw password passed to UsersService
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        username: mockUser.username,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith('testuser');
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      const { password_hash, ...expectedResult } = mockUser;
      expect(result).toEqual(expectedResult);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
    });

    it('should return null for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });

    it('should return null for incorrect password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
    });
  });

  describe('login', () => {
    it('should login user and update last_connection_at', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updateLastConnection.mockResolvedValue(undefined);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt.token.here');

      const loginDto = { email: mockUser.email, password: 'password123' };
      const result = await service.login(loginDto);

      expect(result).toEqual({ token: 'jwt.token.here' });
      expect(mockUsersService.updateLastConnection).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        username: mockUser.username,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const loginDto = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      username: 'newusername',
      email: 'new@example.com',
      password: 'newpassword',
      icon_url: 'https://example.com/avatar.png',
    };

    it('should update user profile successfully', async () => {
      const updatedUser = {
        ...mockUser,
        username: 'newusername',
        email: 'new@example.com',
        icon_path: 'https://example.com/avatar.png',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateDto);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'new@example.com',
      );
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(
        'newusername',
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUser.id, {
        username: 'newusername',
        email: 'new@example.com',
        password: 'newpassword', // Raw password passed to UsersService
        icon_path: 'https://example.com/avatar.png',
      });
    });

    it('should update profile without password', async () => {
      const partialUpdate = { username: 'newusername' };
      const updatedUser = { ...mockUser, username: 'newusername' };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, partialUpdate);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      const otherUser = { ...mockUser, id: 2, email: 'other@example.com' };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.findByEmail.mockResolvedValue(otherUser);

      await expect(
        service.updateProfile(mockUser.id, { email: 'other@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for duplicate username', async () => {
      const otherUser = { ...mockUser, id: 2, username: 'otherusername' };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.findByUsername.mockResolvedValue(otherUser);

      await expect(
        service.updateProfile(mockUser.id, { username: 'otherusername' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same email/username', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await service.updateProfile(mockUser.id, {
        email: mockUser.email,
        username: mockUser.username,
      });

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(mockUsersService.update).toHaveBeenCalled();
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile successfully', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.remove.mockResolvedValue(undefined);

      await service.deleteProfile(mockUser.id);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('OAuth2 methods', () => {
    it('should throw error for OAuth2 login (not implemented)', async () => {
      await expect(
        service.loginWithOAuth2('google', 'auth_code'),
      ).rejects.toThrow('OAuth2 login not yet implemented');
    });

    it('should throw error for OAuth2 register (not implemented)', async () => {
      await expect(
        service.registerWithOAuth2('google', 'auth_code'),
      ).rejects.toThrow('OAuth2 registration not yet implemented');
    });
  });
});
