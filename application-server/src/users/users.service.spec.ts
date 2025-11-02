import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let _repository: Repository<User>;
  let _configService: ConfigService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashedPassword123',
    icon_path: null,
    is_admin: false,
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    last_connection_at: null,
    is_email_verified: false,
    email_verified_at: null,
    email_verification_code: null,
    email_verification_expires: null,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue({
      bcryptSaltRounds: 10,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    _repository = module.get<Repository<User>>(getRepositoryToken(User));
    _configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();
    mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
      is_admin: false,
      is_active: true,
    };

    it('should create a new user with hashed password', async () => {
      const hashedPassword = 'hashedPassword123';
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      mockRepository.create.mockReturnValue({
        ...mockUser,
        email: createUserDto.email,
        username: createUserDto.username,
        password_hash: hashedPassword,
      });

      mockRepository.save.mockResolvedValue({
        ...mockUser,
        email: createUserDto.email,
        username: createUserDto.username,
        password_hash: hashedPassword,
      });

      const result = await service.create(createUserDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        username: createUserDto.username,
        password_hash: hashedPassword,
        is_admin: false,
        is_active: true,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.email).toBe(createUserDto.email);
      expect(result.username).toBe(createUserDto.username);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should set default values for is_admin and is_active', async () => {
      const dtoWithoutDefaults = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      await service.create(dtoWithoutDefaults);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_admin: false,
          is_active: true,
        }),
      );
    });

    it('should respect custom is_admin and is_active values', async () => {
      const dtoWithCustomValues: CreateUserDto = {
        ...createUserDto,
        is_admin: true,
        is_active: false,
      };

      mockRepository.create.mockReturnValue({
        ...mockUser,
        is_admin: true,
        is_active: false,
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        is_admin: true,
        is_active: false,
      });

      const result = await service.create(dtoWithCustomValues);

      expect(result.is_admin).toBe(true);
      expect(result.is_active).toBe(false);
    });

    it('should throw error if config is missing', async () => {
      mockConfigService.get.mockReturnValueOnce(undefined);

      await expect(
        async () =>
          await Test.createTestingModule({
            providers: [
              UsersService,
              {
                provide: getRepositoryToken(User),
                useValue: mockRepository,
              },
              {
                provide: ConfigService,
                useValue: mockConfigService,
              },
            ],
          }).compile(),
      ).rejects.toThrow('App configuration is not properly loaded');
    });
  });

  describe('createWithoutPassword', () => {
    it('should create a user without password (for OAuth users)', async () => {
      const createDto = {
        email: 'oauth@example.com',
        username: 'oauthuser',
      };

      mockRepository.create.mockReturnValue({
        ...mockUser,
        email: createDto.email,
        username: createDto.username,
        password_hash: null,
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        email: createDto.email,
        username: createDto.username,
        password_hash: null,
      });

      const result = await service.createWithoutPassword(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        email: createDto.email,
        username: createDto.username,
        is_admin: false,
        is_active: true,
      });
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.email).toBe(createDto.email);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 2, email: 'user2@example.com', username: 'user2' },
      ];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserResponseDto);
      expect(result[0].email).toBe(mockUser.email);
      expect(result[0]).not.toHaveProperty('password_hash');
    });

    it('should return an empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result?.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return undefined when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
      expect(result).toHaveProperty('password_hash');
    });

    it('should return undefined when email does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toBeDefined();
      expect(result?.username).toBe(mockUser.username);
    });

    it('should return undefined when username does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('findByUsernamePublic', () => {
    it('should return a user response DTO by username', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsernamePublic('testuser');

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result?.username).toBe(mockUser.username);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return undefined when username does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsernamePublic('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('findUserForAuth', () => {
    it('should return full user with password hash for authentication', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserForAuth('test@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('password_hash');
      expect(result?.password_hash).toBe('hashedPassword123');
    });
  });

  describe('update', () => {
    it('should update user without password', async () => {
      const updateDto: UpdateUserDto = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          username: updateDto.username,
          email: updateDto.email,
        });

      const result = await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result?.username).toBe(updateDto.username);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should update user with new password', async () => {
      const updateDto: UpdateUserDto = {
        password: 'newPassword123',
      };
      const newHashedPassword = 'newHashedPassword123';

      mockedBcrypt.hash.mockResolvedValue(newHashedPassword as never);
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          password_hash: newHashedPassword,
        });

      const result = await service.update(1, updateDto);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        password_hash: newHashedPassword,
      });
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.update(999, { username: 'test' });

      expect(result).toBeNull();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update multiple fields including password', async () => {
      const updateDto: UpdateUserDto = {
        username: 'newusername',
        email: 'newemail@example.com',
        password: 'newpassword',
        icon_path: 'new/path.jpg',
      };

      const newHashedPassword = 'newHashedPassword';
      mockedBcrypt.hash.mockResolvedValue(newHashedPassword as never);
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          ...updateDto,
          password_hash: newHashedPassword,
        });

      const result = await service.update(1, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        username: updateDto.username,
        email: updateDto.email,
        icon_path: updateDto.icon_path,
        password_hash: newHashedPassword,
      });
      expect(result?.username).toBe(updateDto.username);
    });
  });

  describe('updateLastConnection', () => {
    it('should update last connection timestamp', async () => {
      const now = new Date();
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        last_connection_at: now,
      });

      const result = await service.updateLastConnection(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result?.last_connection_at).toBeDefined();
    });

    it('should return null when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.updateLastConnection(999);

      expect(result).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validatePassword(mockUser, 'password123');

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123',
      );
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validatePassword(mockUser, 'wrongpassword');

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword123',
      );
      expect(result).toBe(false);
    });

    it('should return false when user has no password hash', async () => {
      const userWithoutPassword = { ...mockUser, password_hash: null };

      const result = await service.validatePassword(
        userWithoutPassword,
        'anypassword',
      );

      expect(result).toBe(false);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.remove(999);

      expect(mockRepository.delete).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });

    it('should handle undefined affected count', async () => {
      mockRepository.delete.mockResolvedValue({ affected: undefined } as any);

      const result = await service.remove(1);

      expect(result).toBe(false);
    });
  });

  describe('Email Verification', () => {
    describe('setVerificationCode', () => {
      it('should set verification code and expiration', async () => {
        const code = 'ABC123';
        const expiresAt = new Date(Date.now() + 3600000);

        mockRepository.update.mockResolvedValue({ affected: 1 } as any);

        await service.setVerificationCode('test@example.com', code, expiresAt);

        expect(mockRepository.update).toHaveBeenCalledWith(
          { email: 'test@example.com' },
          {
            email_verification_code: code,
            email_verification_expires: expiresAt,
            is_email_verified: false,
          },
        );
      });
    });

    describe('verifyEmail', () => {
      it('should verify email with correct code', async () => {
        const verificationCode = 'ABC123';
        const userWithCode = {
          ...mockUser,
          email_verification_code: verificationCode,
          email_verification_expires: new Date(Date.now() + 3600000),
          is_email_verified: false,
        };

        mockRepository.findOne.mockResolvedValue(userWithCode);
        mockRepository.update.mockResolvedValue({ affected: 1 } as any);

        const result = await service.verifyEmail(
          'test@example.com',
          verificationCode,
        );

        expect(result).toBe(true);
        expect(mockRepository.update).toHaveBeenCalledWith(
          { email: 'test@example.com' },
          expect.objectContaining({
            is_email_verified: true,
            email_verification_code: null,
            email_verification_expires: null,
          }),
        );
      });

      it('should return false for incorrect code', async () => {
        const userWithCode = {
          ...mockUser,
          email_verification_code: 'ABC123',
          email_verification_expires: new Date(Date.now() + 3600000),
        };

        mockRepository.findOne.mockResolvedValue(userWithCode);

        const result = await service.verifyEmail('test@example.com', 'WRONG');

        expect(result).toBe(false);
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should return false for expired code', async () => {
        const userWithCode = {
          ...mockUser,
          email_verification_code: 'ABC123',
          email_verification_expires: new Date(Date.now() - 1000),
        };

        mockRepository.findOne.mockResolvedValue(userWithCode);

        const result = await service.verifyEmail('test@example.com', 'ABC123');

        expect(result).toBe(false);
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      it('should return false when user does not exist', async () => {
        mockRepository.findOne.mockResolvedValue(null);

        const result = await service.verifyEmail(
          'nonexistent@example.com',
          'ABC123',
        );

        expect(result).toBe(false);
      });
    });

    describe('isEmailVerified', () => {
      it('should return true for verified email', async () => {
        const verifiedUser = { ...mockUser, is_email_verified: true };
        mockRepository.findOne.mockResolvedValue(verifiedUser);

        const result = await service.isEmailVerified('test@example.com');

        expect(result).toBe(true);
      });

      it('should return false for unverified email', async () => {
        mockRepository.findOne.mockResolvedValue(mockUser);

        const result = await service.isEmailVerified('test@example.com');

        expect(result).toBe(false);
      });

      it('should return false when user does not exist', async () => {
        mockRepository.findOne.mockResolvedValue(null);

        const result = await service.isEmailVerified('nonexistent@example.com');

        expect(result).toBe(false);
      });
    });
  });
});
