import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let _service: UsersService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashedPassword',
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

  const mockUserResponseDto = new UserResponseDto(mockUser);

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findByUsernamePublic: jest.fn(),
    update: jest.fn(),
    updateLastConnection: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    _service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(undefined);
      mockUsersService.findByUsername.mockResolvedValue(undefined);
      mockUsersService.create.mockResolvedValue(mockUserResponseDto);

      const result = await controller.create(createUserDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(
        createUserDto.username,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUserResponseDto);
    });

    it('should throw CONFLICT when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should throw CONFLICT when username already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(undefined);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        new HttpException(
          'User with this username already exists',
          HttpStatus.CONFLICT,
        ),
      );

      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(
        createUserDto.username,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUserResponseDto];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('should return an empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponseDto);

      const result = await controller.findOne('1');

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserResponseDto);
    });

    it('should throw BAD_REQUEST for invalid id format', async () => {
      await expect(controller.findOne('invalid')).rejects.toThrow(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);

      await expect(controller.findOne('999')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(mockUsersService.findOne).toHaveBeenCalledWith(999);
    });

    it('should handle id with leading zeros', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponseDto);

      const result = await controller.findOne('001');

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserResponseDto);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      username: 'updateduser',
    };

    it('should update a user successfully', async () => {
      mockUsersService.findByUsername.mockResolvedValue(undefined);
      mockUsersService.update.mockResolvedValue(mockUserResponseDto);

      const result = await controller.update('1', updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toEqual(mockUserResponseDto);
    });

    it('should throw BAD_REQUEST for invalid id format', async () => {
      await expect(controller.update('invalid', updateUserDto)).rejects.toThrow(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.update.mockResolvedValue(null);

      await expect(controller.update('999', updateUserDto)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw CONFLICT when updating to existing email', async () => {
      const updateDto: UpdateUserDto = { email: 'existing@example.com' };
      const existingUser = { ...mockUser, id: 2 };

      mockUsersService.findByEmail.mockResolvedValue(existingUser);

      await expect(controller.update('1', updateDto)).rejects.toThrow(
        new HttpException(
          'Another user with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );

      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should throw CONFLICT when updating to existing username', async () => {
      const updateDto: UpdateUserDto = { username: 'existinguser' };
      const existingUser = { ...mockUser, id: 2 };

      mockUsersService.findByUsername.mockResolvedValue(existingUser);

      await expect(controller.update('1', updateDto)).rejects.toThrow(
        new HttpException(
          'Another user with this username already exists',
          HttpStatus.CONFLICT,
        ),
      );

      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should allow updating to same email', async () => {
      const updateDto: UpdateUserDto = { email: mockUser.email };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(mockUserResponseDto);

      const result = await controller.update('1', updateDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockUserResponseDto);
    });

    it('should allow updating to same username', async () => {
      const updateDto: UpdateUserDto = { username: mockUser.username };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(mockUserResponseDto);

      const result = await controller.update('1', updateDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockUserResponseDto);
    });

    it('should handle updating multiple fields at once', async () => {
      const updateDto: UpdateUserDto = {
        username: 'newusername',
        email: 'newemail@example.com',
        password: 'newpassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(undefined);
      mockUsersService.findByUsername.mockResolvedValue(undefined);
      mockUsersService.update.mockResolvedValue(mockUserResponseDto);

      const result = await controller.update('1', updateDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        updateDto.email,
      );
      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(
        updateDto.username,
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockUserResponseDto);
    });

    it('should not check email uniqueness when email is not being updated', async () => {
      const updateDto: UpdateUserDto = { username: 'newusername' };

      mockUsersService.findByUsername.mockResolvedValue(undefined);
      mockUsersService.update.mockResolvedValue(mockUserResponseDto);

      await controller.update('1', updateDto);

      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
      expect(mockUsersService.findByUsername).toHaveBeenCalled();
    });

    it('should not check username uniqueness when username is not being updated', async () => {
      const updateDto: UpdateUserDto = { email: 'newemail@example.com' };

      mockUsersService.findByEmail.mockResolvedValue(undefined);
      mockUsersService.update.mockResolvedValue(mockUserResponseDto);

      await controller.update('1', updateDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalled();
      expect(mockUsersService.findByUsername).not.toHaveBeenCalled();
    });
  });

  describe('updateLastConnection', () => {
    it('should update last connection successfully', async () => {
      mockUsersService.updateLastConnection.mockResolvedValue(
        mockUserResponseDto,
      );

      const result = await controller.updateLastConnection('1');

      expect(mockUsersService.updateLastConnection).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Last connection updated successfully',
        user: mockUserResponseDto,
      });
    });

    it('should throw BAD_REQUEST for invalid id format', async () => {
      await expect(controller.updateLastConnection('invalid')).rejects.toThrow(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      expect(mockUsersService.updateLastConnection).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.updateLastConnection.mockResolvedValue(null);

      await expect(controller.updateLastConnection('999')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(mockUsersService.updateLastConnection).toHaveBeenCalledWith(999);
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      mockUsersService.findByUsernamePublic.mockResolvedValue(
        mockUserResponseDto,
      );

      const result = await controller.findByUsername('testuser');

      expect(mockUsersService.findByUsernamePublic).toHaveBeenCalledWith(
        'testuser',
      );
      expect(result).toEqual(mockUserResponseDto);
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.findByUsernamePublic.mockResolvedValue(undefined);

      await expect(controller.findByUsername('nonexistent')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(mockUsersService.findByUsernamePublic).toHaveBeenCalledWith(
        'nonexistent',
      );
    });

    it('should handle usernames with special characters', async () => {
      mockUsersService.findByUsernamePublic.mockResolvedValue(
        mockUserResponseDto,
      );

      const result = await controller.findByUsername('test_user-123');

      expect(mockUsersService.findByUsernamePublic).toHaveBeenCalledWith(
        'test_user-123',
      );
      expect(result).toEqual(mockUserResponseDto);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockUsersService.remove.mockResolvedValue(true);

      const result = await controller.remove('1');

      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw BAD_REQUEST for invalid id format', async () => {
      await expect(controller.remove('invalid')).rejects.toThrow(
        new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST),
      );

      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.remove.mockResolvedValue(false);

      await expect(controller.remove('999')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(mockUsersService.remove).toHaveBeenCalledWith(999);
    });

    it('should handle negative ids as valid numbers but non-existent users', async () => {
      mockUsersService.remove.mockResolvedValue(false);

      await expect(controller.remove('-1')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(mockUsersService.remove).toHaveBeenCalledWith(-1);
    });
  });
});
