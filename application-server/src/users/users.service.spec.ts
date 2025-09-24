import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = service.create(createUserDto);

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.email).toBe(createUserDto.email);
      expect(user.firstName).toBe(createUserDto.firstName);
      expect(user.lastName).toBe(createUserDto.lastName);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      service.create(createUserDto);
      const users = service.findAll();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(createUserDto.email);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = service.create(createUserDto);
      const foundUser = service.findOne(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
    });

    it('should return undefined for non-existent user', () => {
      const user = service.findOne(999);
      expect(user).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      service.create(createUserDto);
      const foundUser = service.findByEmail(createUserDto.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(createUserDto.email);
    });
  });

  describe('update', () => {
    it('should update a user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = service.create(createUserDto);
      const updateDto = { firstName: 'Jane' };
      const updatedUser = service.update(createdUser.id, updateDto);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe('Jane');
      expect(updatedUser?.updatedAt).not.toBe(createdUser.updatedAt);
    });

    it('should return null for non-existent user', () => {
      const result = service.update(999, { firstName: 'Jane' });
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a user', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const createdUser = service.create(createUserDto);
      const success = service.remove(createdUser.id);

      expect(success).toBe(true);
      expect(service.findOne(createdUser.id)).toBeUndefined();
    });

    it('should return false for non-existent user', () => {
      const success = service.remove(999);
      expect(success).toBe(false);
    });
  });
});