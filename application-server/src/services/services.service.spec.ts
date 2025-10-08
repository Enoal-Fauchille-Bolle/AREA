import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import {
  Component,
  ComponentType,
} from '../components/entities/component.entity';
import {
  Variable,
  VariableKind,
  VariableType,
} from '../variables/entities/variable.entity';
import { UserService } from '../user-services/entities/user-service.entity';
import { DiscordOAuth2Service } from './oauth2/discord-oauth2.service';
describe('ServicesService', () => {
  let service: ServicesService;
  let _serviceRepository: Repository<Service>;
  let _componentRepository: Repository<Component>;
  let _variableRepository: Repository<Variable>;
  let _userServiceRepository: Repository<UserService>;
  let _configService: ConfigService;
  let _discordOAuth2Service: DiscordOAuth2Service;

  const mockService: Service = {
    id: 1,
    name: 'Discord',
    description: 'Communication platform',
    icon_path: 'assets/services/discord.svg',
    requires_auth: true,
    is_active: true,
  };

  const mockServiceNoAuth: Service = {
    id: 2,
    name: 'Time',
    description: 'Time service',
    icon_path: null,
    requires_auth: false,
    is_active: true,
  };

  const mockComponent: Partial<Component> = {
    id: 1,
    service_id: 1,
    type: ComponentType.ACTION,
    name: 'New Message',
    description: 'Triggered when a new message is sent',
    webhook_endpoint: null,
    polling_interval: null,
    is_active: true,
  };

  const mockVariable: Partial<Variable> = {
    id: 1,
    component_id: 1,
    name: 'channel_id',
    description: 'Channel ID',
    kind: VariableKind.PARAMETER,
    type: VariableType.STRING,
    nullable: false,
    placeholder: 'Enter channel ID',
    validation_regex: null,
    display_order: 1,
  };

  const mockUserService: Partial<UserService> = {
    user_id: 1,
    service_id: 1,
    oauth_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    token_expires_at: new Date(Date.now() + 3600000),
    created_at: new Date(),
    updated_at: new Date(),
    service: mockService,
  };

  const mockServiceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockComponentRepository = {
    find: jest.fn(),
  };

  const mockVariableRepository = {
    find: jest.fn(),
  };

  const mockUserServiceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue({
      serverUrl: 'http://localhost:8080',
      oauth2: {
        discord: {
          clientId: 'mock_client_id',
          clientSecret: 'mock_client_secret',
          redirectUri: 'http://localhost:3000/callback',
        },
      },
    }),
  };

  const mockDiscordOAuth2Service = {
    exchangeCodeForTokens: jest.fn(),
    refreshAccessToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
        {
          provide: getRepositoryToken(Component),
          useValue: mockComponentRepository,
        },
        {
          provide: getRepositoryToken(Variable),
          useValue: mockVariableRepository,
        },
        {
          provide: getRepositoryToken(UserService),
          useValue: mockUserServiceRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DiscordOAuth2Service,
          useValue: mockDiscordOAuth2Service,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    _serviceRepository = module.get<Repository<Service>>(
      getRepositoryToken(Service),
    );
    _componentRepository = module.get<Repository<Component>>(
      getRepositoryToken(Component),
    );
    _variableRepository = module.get<Repository<Variable>>(
      getRepositoryToken(Variable),
    );
    _userServiceRepository = module.get<Repository<UserService>>(
      getRepositoryToken(UserService),
    );
    _configService = module.get<ConfigService>(ConfigService);
    _discordOAuth2Service =
      module.get<DiscordOAuth2Service>(DiscordOAuth2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of services', async () => {
      mockServiceRepository.find.mockResolvedValue([
        mockService,
        mockServiceNoAuth,
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(mockService.id);
      expect(result[0].name).toBe(mockService.name);
      expect(result[0].icon_url).toBe(
        'http://localhost:8080/assets/services/discord.svg',
      );
      expect(result[1].icon_url).toBeNull();
      expect(mockServiceRepository.find).toHaveBeenCalledWith({});
    });

    it('should return an empty array when no services exist', async () => {
      mockServiceRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
      expect(mockServiceRepository.find).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a single service', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.findOne(1);

      expect(result.id).toBe(mockService.id);
      expect(result.name).toBe(mockService.name);
      expect(mockServiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Service with ID 999 not found',
      );
    });
  });

  describe('findAllActions', () => {
    it('should return all actions for a service', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockComponentRepository.find.mockResolvedValue([mockComponent]);
      mockVariableRepository.find.mockResolvedValue([mockVariable]);

      const result = await service.findAllActions(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(mockComponentRepository.find).toHaveBeenCalledWith({
        where: { service_id: 1, type: ComponentType.ACTION },
      });
      expect(mockVariableRepository.find).toHaveBeenCalledWith({
        where: { component_id: 1 },
        order: { display_order: 'ASC' },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllActions(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findAllActions(999)).rejects.toThrow(
        'Service with ID 999 not found',
      );
    });

    it('should return empty array when service has no actions', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockComponentRepository.find.mockResolvedValue([]);

      const result = await service.findAllActions(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findAllReactions', () => {
    it('should return all reactions for a service', async () => {
      const mockReaction: Partial<Component> = {
        ...mockComponent,
        type: ComponentType.REACTION,
      };
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockComponentRepository.find.mockResolvedValue([mockReaction]);
      mockVariableRepository.find.mockResolvedValue([mockVariable]);

      const result = await service.findAllReactions(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(mockComponentRepository.find).toHaveBeenCalledWith({
        where: { service_id: 1, type: ComponentType.REACTION },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllReactions(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllComponents', () => {
    it('should return all components for a service', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockComponentRepository.find.mockResolvedValue([mockComponent]);
      mockVariableRepository.find.mockResolvedValue([mockVariable]);

      const result = await service.findAllComponents(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(mockComponentRepository.find).toHaveBeenCalledWith({
        where: { service_id: 1 },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllComponents(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserServices', () => {
    it('should return all services linked to a user', async () => {
      mockUserServiceRepository.find.mockResolvedValue([mockUserService]);

      const result = await service.findUserServices(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockService.id);
      expect(result[0].name).toBe(mockService.name);
      expect(mockUserServiceRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        relations: ['service'],
      });
    });

    it('should return empty array when user has no linked services', async () => {
      mockUserServiceRepository.find.mockResolvedValue([]);

      const result = await service.findUserServices(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('linkService - Discord OAuth2', () => {
    it('should create new service link with OAuth2 code', async () => {
      const mockTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.findOne.mockResolvedValue(null);
      mockDiscordOAuth2Service.exchangeCodeForTokens.mockResolvedValue(
        mockTokens,
      );
      mockUserServiceRepository.create.mockReturnValue({
        user_id: 1,
        service_id: 1,
        oauth_token: mockTokens.accessToken,
        refresh_token: mockTokens.refreshToken,
        token_expires_at: mockTokens.expiresAt,
      });
      mockUserServiceRepository.save.mockResolvedValue({});

      await service.linkService(1, 1, 'authorization_code');

      expect(
        mockDiscordOAuth2Service.exchangeCodeForTokens,
      ).toHaveBeenCalledWith('authorization_code');
      expect(mockUserServiceRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        service_id: 1,
        oauth_token: mockTokens.accessToken,
        refresh_token: mockTokens.refreshToken,
        token_expires_at: mockTokens.expiresAt,
      });
      expect(mockUserServiceRepository.save).toHaveBeenCalled();
    });

    it('should update existing service link with new OAuth2 tokens', async () => {
      const mockTokens = {
        accessToken: 'updated_access_token',
        refreshToken: 'updated_refresh_token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.findOne.mockResolvedValue(mockUserService);
      mockDiscordOAuth2Service.exchangeCodeForTokens.mockResolvedValue(
        mockTokens,
      );
      mockUserServiceRepository.save.mockResolvedValue({});

      await service.linkService(1, 1, 'new_authorization_code');

      expect(
        mockDiscordOAuth2Service.exchangeCodeForTokens,
      ).toHaveBeenCalledWith('new_authorization_code');
      expect(mockUserService.oauth_token).toBe(mockTokens.accessToken);
      expect(mockUserService.refresh_token).toBe(mockTokens.refreshToken);
      expect(mockUserService.token_expires_at).toBe(mockTokens.expiresAt);
      expect(mockUserServiceRepository.save).toHaveBeenCalledWith(
        mockUserService,
      );
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.linkService(1, 999, 'code')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.linkService(1, 999, 'code')).rejects.toThrow(
        'Service with ID 999 not found',
      );
    });

    it('should throw BadRequestException when no code provided and service not linked', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.linkService(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.linkService(1, 1)).rejects.toThrow(
        'Invalid request body',
      );
    });

    it('should not throw error when service already linked and no code provided', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.findOne.mockResolvedValue(mockUserService);

      await expect(service.linkService(1, 1)).resolves.not.toThrow();
    });

    it('should handle non-OAuth2 services', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockServiceNoAuth);
      mockUserServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.linkService(1, 2)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('unlinkService', () => {
    it('should successfully unlink a service', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.delete.mockResolvedValue({ affected: 1 });

      await service.unlinkService(1, 1);

      expect(mockUserServiceRepository.delete).toHaveBeenCalledWith({
        user_id: 1,
        service_id: 1,
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkService(1, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.unlinkService(1, 999)).rejects.toThrow(
        'Service with ID 999 not found',
      );
    });

    it('should throw NotFoundException when user service link does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.unlinkService(1, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.unlinkService(1, 1)).rejects.toThrow(
        'User service link not found for user 1 and service 1',
      );
    });
  });

  describe('refreshServiceToken', () => {
    it('should successfully refresh Discord access token', async () => {
      const mockTokens = {
        accessToken: 'refreshed_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const userServiceCopy: Partial<UserService> = { ...mockUserService };
      const originalRefreshToken = userServiceCopy.refresh_token;

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.findOne.mockResolvedValue(userServiceCopy);
      mockDiscordOAuth2Service.refreshAccessToken.mockResolvedValue(mockTokens);
      mockUserServiceRepository.save.mockResolvedValue({});

      await service.refreshServiceToken(1, 1);

      expect(mockDiscordOAuth2Service.refreshAccessToken).toHaveBeenCalledWith(
        originalRefreshToken,
      );
      expect(userServiceCopy.oauth_token).toBe(mockTokens.accessToken);
      expect(userServiceCopy.refresh_token).toBe(mockTokens.refreshToken);
      expect(userServiceCopy.token_expires_at).toBe(mockTokens.expiresAt);
      expect(mockUserServiceRepository.save).toHaveBeenCalledWith(
        userServiceCopy,
      );
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshServiceToken(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-Discord services', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockServiceNoAuth);

      await expect(service.refreshServiceToken(1, 2)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.refreshServiceToken(1, 2)).rejects.toThrow(
        'Service Time does not support token refresh',
      );
    });

    it('should throw NotFoundException when user service link does not exist', async () => {
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshServiceToken(1, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.refreshServiceToken(1, 1)).rejects.toThrow(
        'User service link not found or no refresh token available',
      );
    });

    it('should throw NotFoundException when no refresh token available', async () => {
      const userServiceNoRefresh = { ...mockUserService, refresh_token: null };
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockUserServiceRepository.findOne.mockResolvedValue(userServiceNoRefresh);

      await expect(service.refreshServiceToken(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
