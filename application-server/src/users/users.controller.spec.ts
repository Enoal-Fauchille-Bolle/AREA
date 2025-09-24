import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = controller.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw conflict exception for duplicate email', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      controller.create(createUserDto);

      expect(() => controller.create(createUserDto)).toThrow(
        new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      controller.create(createUserDto);
      const result = controller.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = controller.create(createUserDto);
      const result = controller.findOne(createdUser.id.toString());

      expect(result).toEqual(createdUser);
    });

    it('should throw not found exception for non-existent user', () => {
      expect(() => controller.findOne('999')).toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('update', () => {
    it('should update a user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = controller.create(createUserDto);
      const updateDto = { firstName: 'Jane' };
      const result = controller.update(createdUser.id.toString(), updateDto);

      expect(result.firstName).toBe('Jane');
    });

    it('should throw not found exception for non-existent user', () => {
      expect(() => controller.update('999', { firstName: 'Jane' })).toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = controller.create(createUserDto);
      const result = controller.remove(createdUser.id.toString());

      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw not found exception for non-existent user', () => {
      expect(() => controller.remove('999')).toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});