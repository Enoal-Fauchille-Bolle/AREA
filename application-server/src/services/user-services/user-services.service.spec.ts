/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserServicesService } from './user-services.service';
import { UserService } from './entities/user-service.entity';
import { Service } from '../entities/service.entity';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UserServicesService', () => {
  let service: UserServicesService;
  let mockUserServiceRepository: any;
  let mockServiceRepository: any;
  let mockUsersService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockUserServiceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockServiceRepository = {
      findOne: jest.fn(),
    };

    mockUsersService = {
      findOne: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue({
        serverUrl: 'http://localhost:3000',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserServicesService,
        {
          provide: getRepositoryToken(UserService),
          useValue: mockUserServiceRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
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

    service = module.get<UserServicesService>(UserServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      user_id: 1,
      service_id: 2,
      oauth_token: 'token123',
      refresh_token: 'refresh123',
      token_expires_at: new Date(),
    };

    it('should create a user service connection', async () => {
      mockUserServiceRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
      mockServiceRepository.findOne.mockResolvedValue({
        id: 2,
        name: 'TestService',
        requires_auth: true,
        icon_path: '/icons/test.svg',
      });

      const mockUserService = {
        id: 1,
        ...createDto,
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        service: {
          id: 2,
          name: 'TestService',
          requires_auth: true,
          icon_path: '/icons/test.svg',
        },
      };
      mockUserServiceRepository.create.mockReturnValue(mockUserService);
      mockUserServiceRepository.save.mockResolvedValue(mockUserService);

      const result = await service.create(createDto);

      expect(mockUserServiceRepository.findOne).toHaveBeenCalled();
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(mockServiceRepository.findOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if connection already exists', async () => {
      mockUserServiceRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'User is already connected to this service',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserServiceRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if service not found', async () => {
      mockUserServiceRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({ id: 1 });
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if service requires auth but no token provided', async () => {
      const dtoWithoutToken = { ...createDto, oauth_token: undefined };

      mockUserServiceRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({ id: 1 });
      mockServiceRepository.findOne.mockResolvedValue({
        id: 2,
        requires_auth: true,
      });

      await expect(service.create(dtoWithoutToken)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dtoWithoutToken)).rejects.toThrow(
        'OAuth token is required',
      );
    });

    it('should create connection without token if service does not require auth', async () => {
      const dtoWithoutToken = { ...createDto, oauth_token: undefined };

      mockUserServiceRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });
      mockServiceRepository.findOne.mockResolvedValue({
        id: 2,
        name: 'TestService',
        requires_auth: false,
        icon_path: '/icons/test.svg',
      });

      const mockUserService = {
        id: 1,
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        service: {
          id: 2,
          name: 'TestService',
          requires_auth: false,
          icon_path: '/icons/test.svg',
        },
      };
      mockUserServiceRepository.create.mockReturnValue(mockUserService);
      mockUserServiceRepository.save.mockResolvedValue(mockUserService);

      await service.create(dtoWithoutToken);

      expect(mockUserServiceRepository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all user services', async () => {
      const mockServices = [
        {
          id: 1,
          user_id: 1,
          service_id: 2,
          user: { id: 1, username: 'user1', email: 'user1@example.com' },
          service: { id: 2, name: 'Service1', icon_path: '/icon1.svg' },
        },
        {
          id: 2,
          user_id: 2,
          service_id: 3,
          user: { id: 2, username: 'user2', email: 'user2@example.com' },
          service: { id: 3, name: 'Service2', icon_path: '/icon2.svg' },
        },
      ];

      mockUserServiceRepository.find.mockResolvedValue(mockServices);

      const result = await service.findAll();

      expect(mockUserServiceRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'service'],
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a user service if found', async () => {
      const mockService = {
        id: 1,
        user_id: 1,
        service_id: 2,
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        service: { id: 2, name: 'TestService', icon_path: '/icon.svg' },
      };

      mockUserServiceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.findOne(1, 2);

      expect(mockUserServiceRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, service_id: 2 },
        relations: ['user', 'service'],
      });
      expect(result).toBeDefined();
    });

    it('should return null if not found', async () => {
      mockUserServiceRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(1, 2);

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return all services for a user', async () => {
      const mockServices = [
        {
          id: 1,
          user_id: 1,
          service_id: 2,
          user: { id: 1, username: 'user1', email: 'user1@example.com' },
          service: { id: 2, name: 'Service1', icon_path: '/icon1.svg' },
        },
        {
          id: 2,
          user_id: 1,
          service_id: 3,
          user: { id: 1, username: 'user1', email: 'user1@example.com' },
          service: { id: 3, name: 'Service2', icon_path: '/icon2.svg' },
        },
      ];

      mockUserServiceRepository.find.mockResolvedValue(mockServices);

      const result = await service.findByUser(1);

      expect(mockUserServiceRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        relations: ['user', 'service'],
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByService', () => {
    it('should return all users connected to a service', async () => {
      const mockServices = [
        {
          id: 1,
          user_id: 1,
          service_id: 2,
          user: { id: 1, username: 'user1', email: 'user1@example.com' },
          service: { id: 2, name: 'TestService', icon_path: '/icon.svg' },
        },
        {
          id: 2,
          user_id: 2,
          service_id: 2,
          user: { id: 2, username: 'user2', email: 'user2@example.com' },
          service: { id: 2, name: 'TestService', icon_path: '/icon.svg' },
        },
      ];

      mockUserServiceRepository.find.mockResolvedValue(mockServices);

      const result = await service.findByService(2);

      expect(mockUserServiceRepository.find).toHaveBeenCalledWith({
        where: { service_id: 2 },
        relations: ['user', 'service'],
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    const updateDto = {
      user_id: 1,
      service_id: 2,
      oauth_token: 'new-token',
    };

    it('should update a user service', async () => {
      const mockService = {
        id: 1,
        user_id: 1,
        service_id: 2,
        user: { id: 1, username: 'user1', email: 'user1@example.com' },
        service: {
          id: 2,
          name: 'TestService',
          requires_auth: true,
          icon_path: '/icon.svg',
        },
      };

      mockUserServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.save.mockResolvedValue({
        ...mockService,
        oauth_token: 'new-token',
      });

      const result = await service.update(updateDto);

      expect(mockUserServiceRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if service not found', async () => {
      mockUserServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.update(updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if auth required but no token provided', async () => {
      const mockService = {
        id: 1,
        user_id: 1,
        service_id: 2,
        service: { requires_auth: true },
      };

      mockUserServiceRepository.findOne.mockResolvedValue(mockService);

      await expect(
        service.update({ ...updateDto, oauth_token: undefined }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeOne', () => {
    it('should remove a user service', async () => {
      const mockService = { id: 1, user_id: 1, service_id: 2 };

      mockUserServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.remove.mockResolvedValue(mockService);

      await service.removeOne(1, 2);

      expect(mockUserServiceRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, service_id: 2 },
      });
      expect(mockUserServiceRepository.remove).toHaveBeenCalledWith(
        mockService,
      );
    });

    it('should throw NotFoundException if service not found', async () => {
      mockUserServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.removeOne(1, 2)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeForUser', () => {
    it('should remove all services for a user', async () => {
      const mockServices = [
        { id: 1, user_id: 1, service_id: 2 },
        { id: 2, user_id: 1, service_id: 3 },
      ];

      mockUserServiceRepository.find.mockResolvedValue(mockServices);
      mockUserServiceRepository.remove.mockResolvedValue(mockServices);

      await service.removeForUser(1);

      expect(mockUserServiceRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
      });
      expect(mockUserServiceRepository.remove).toHaveBeenCalledWith(
        mockServices,
      );
    });
  });
});
