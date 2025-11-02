/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserOAuth2AccountsService } from './user-oauth2-account.service';
import { UserOAuth2Account } from './entities/user-oauth2-account.entity';
import { UsersService } from '../../users/users.service';
import { ServicesService } from '../../services/services.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UserOAuth2AccountsService', () => {
  let service: UserOAuth2AccountsService;
  let mockRepository: any;
  let mockUsersService: any;
  let mockServicesService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockUsersService = {
      findOne: jest.fn(),
    };

    mockServicesService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserOAuth2AccountsService,
        {
          provide: getRepositoryToken(UserOAuth2Account),
          useValue: mockRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    service = module.get<UserOAuth2AccountsService>(UserOAuth2AccountsService);
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
      oauth2_provider_user_id: 'google-123',
      email: 'test@example.com',
    };

    it('should create a new OAuth2 account', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({ id: 1 });
      mockServicesService.findOne.mockResolvedValue({
        id: 2,
        requires_auth: true,
      });

      const mockAccount = {
        service_id: 2,
        service_account_id: 'google-123',
        user_id: 1,
        email: 'test@example.com',
      };

      mockRepository.create.mockReturnValue(mockAccount);
      mockRepository.save.mockResolvedValue(mockAccount);

      const result = await service.create(createDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, service_id: 2 },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if account already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue(null);
      mockServicesService.findOne.mockResolvedValue({ id: 2 });

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if service not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({ id: 1 });
      mockServicesService.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if service does not require auth', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({ id: 1 });
      mockServicesService.findOne.mockResolvedValue({
        id: 2,
        requires_auth: false,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Cannot create OAuth2 account for a service that does not require authentication',
      );
    });

    it('should handle null email', async () => {
      const dtoWithoutEmail = {
        ...createDto,
        email: undefined,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockUsersService.findOne.mockResolvedValue({ id: 1 });
      mockServicesService.findOne.mockResolvedValue({
        id: 2,
        requires_auth: true,
      });

      mockRepository.create.mockReturnValue({
        service_id: 2,
        service_account_id: 'google-123',
        user_id: 1,
        email: null,
      });
      mockRepository.save.mockResolvedValue({});

      await service.create(dtoWithoutEmail);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: null,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an OAuth2 account if found', async () => {
      const mockAccount = {
        service_id: 2,
        user_id: 1,
        service_account_id: 'google-123',
        user: { id: 1 },
        service: { id: 2 },
      };

      mockRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findOne(1, 2);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, service_id: 2 },
        relations: ['user', 'service'],
      });
      expect(result).toBeDefined();
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(1, 2);

      expect(result).toBeNull();
    });
  });

  describe('findByServiceAccountId', () => {
    it('should return an OAuth2 account by service account id', async () => {
      const mockAccount = {
        service_id: 2,
        service_account_id: 'google-123',
        user: { id: 1 },
        service: { id: 2 },
      };

      mockRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findByServiceAccountId(2, 'google-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { service_id: 2, service_account_id: 'google-123' },
        relations: ['user', 'service'],
      });
      expect(result).toBeDefined();
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByServiceAccountId(2, 'google-123');

      expect(result).toBeNull();
    });
  });

  describe('updateEmail', () => {
    it('should update the email of an OAuth2 account', async () => {
      const mockAccount = {
        service_id: 2,
        user_id: 1,
        email: 'old@example.com',
        user: { id: 1 },
        service: { id: 2 },
      };

      mockRepository.findOne.mockResolvedValue(mockAccount);
      mockRepository.save.mockResolvedValue({
        ...mockAccount,
        email: 'new@example.com',
      });

      const result = await service.updateEmail(1, 2, 'new@example.com');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if account not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateEmail(1, 2, 'new@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeOne', () => {
    it('should remove an OAuth2 account', async () => {
      const mockAccount = {
        service_id: 2,
        user_id: 1,
      };

      mockRepository.findOne.mockResolvedValue(mockAccount);
      mockRepository.remove.mockResolvedValue(mockAccount);

      await service.removeOne(1, 2);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1, service_id: 2 },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockAccount);
    });

    it('should throw NotFoundException if account not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.removeOne(1, 2)).rejects.toThrow(NotFoundException);
    });
  });
});
