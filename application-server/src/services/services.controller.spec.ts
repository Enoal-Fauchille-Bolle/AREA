import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import {
  ServiceResponseDto,
  ServiceActionsResponseDto,
  ServiceReactionsResponseDto,
  ServiceComponentsResponseDto,
  LinkServiceDto,
  LinkPlatform,
} from './dto';

describe('ServicesController', () => {
  let controller: ServicesController;
  let _service: ServicesService;
  let _configService: ConfigService;

  const mockService: ServiceResponseDto = {
    id: 1,
    name: 'test_service',
    description: 'Test service description',
    icon_url: 'http://localhost/test-icon.png',
    requires_auth: true,
    is_active: true,
  };

  const mockAction: ServiceActionsResponseDto = {
    id: 1,
    name: 'test_action',
    description: 'Test action description',
  } as ServiceActionsResponseDto;

  const mockReaction: ServiceReactionsResponseDto = {
    id: 1,
    name: 'test_reaction',
    description: 'Test reaction description',
  } as ServiceReactionsResponseDto;

  const mockComponent: ServiceComponentsResponseDto = {
    id: 1,
    name: 'test_component',
    description: 'Test component description',
  } as ServiceComponentsResponseDto;

  const mockServicesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findUserServices: jest.fn(),
    findAllActions: jest.fn(),
    findAllReactions: jest.fn(),
    findAllComponents: jest.fn(),
    linkTrello: jest.fn(),
    linkService: jest.fn(),
    unlinkService: jest.fn(),
    refreshServiceToken: jest.fn(),
    getDiscordProfile: jest.fn(),
    getGitHubProfile: jest.fn(),
    getTwitchProfile: jest.fn(),
    getTrelloProfile: jest.fn(),
    getTrelloAuthUrl: jest.fn(),
    disconnectService: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    _service = module.get<ServicesService>(ServicesService);
    _configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all services', async () => {
      mockServicesService.findAll.mockResolvedValue([mockService]);

      const result = await controller.findAll();

      expect(result).toEqual([mockService]);
      expect(mockServicesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findMyServices', () => {
    it('should return user services', async () => {
      const req = { user: { id: 1 } };
      mockServicesService.findUserServices.mockResolvedValue([mockService]);

      const result = await controller.findMyServices(req);

      expect(result).toEqual([mockService]);
      expect(mockServicesService.findUserServices).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockServicesService.findOne.mockResolvedValue(mockService);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockService);
      expect(mockServicesService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.findOne('invalid')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.findOne('invalid')).rejects.toThrow(
        'Invalid ID format',
      );
    });

    it('should return a service even for negative id if service exists', async () => {
      // The controller uses parseInt which accepts negative numbers
      mockServicesService.findOne.mockResolvedValue(mockService);
      const result = await controller.findOne('-1');
      expect(result).toEqual(mockService);
      expect(mockServicesService.findOne).toHaveBeenCalledWith(-1);
    });
  });

  describe('findAllActions', () => {
    it('should return all actions for a service', async () => {
      mockServicesService.findAllActions.mockResolvedValue([mockAction]);

      const result = await controller.findAllActions('1');

      expect(result).toEqual([mockAction]);
      expect(mockServicesService.findAllActions).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.findAllActions('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllReactions', () => {
    it('should return all reactions for a service', async () => {
      mockServicesService.findAllReactions.mockResolvedValue([mockReaction]);

      const result = await controller.findAllReactions('1');

      expect(result).toEqual([mockReaction]);
      expect(mockServicesService.findAllReactions).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.findAllReactions('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllComponents', () => {
    it('should return all components for a service', async () => {
      mockServicesService.findAllComponents.mockResolvedValue([mockComponent]);

      const result = await controller.findAllComponents('1');

      expect(result).toEqual([mockComponent]);
      expect(mockServicesService.findAllComponents).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.findAllComponents('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('linkTrello', () => {
    it('should link Trello service with token', async () => {
      const req = { user: { id: 1 } };
      mockServicesService.linkTrello.mockResolvedValue(undefined);

      await controller.linkTrello(req, { token: 'test-token' });

      expect(mockServicesService.linkTrello).toHaveBeenCalledWith(
        1,
        'test-token',
      );
    });

    it('should throw BadRequestException when token is missing', async () => {
      const req = { user: { id: 1 } };

      await expect(controller.linkTrello(req, {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.linkTrello(req, {})).rejects.toThrow(
        'Valid Trello token is required',
      );
    });

    it('should throw BadRequestException when token is not a string', async () => {
      const req = { user: { id: 1 } };
      const invalidBody = { token: 123 };

      await expect(
        // @ts-expect-error Testing invalid input type
        controller.linkTrello(req, invalidBody),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('linkService', () => {
    it('should link a service', async () => {
      const req = { user: { id: 1 } };
      const linkDto: LinkServiceDto = {
        code: 'auth-code',
        platform: LinkPlatform.WEB,
      };
      mockServicesService.linkService.mockResolvedValue(undefined);

      await controller.linkService(req, '1', linkDto);

      expect(mockServicesService.linkService).toHaveBeenCalledWith(
        1,
        1,
        linkDto,
      );
    });

    it('should throw BadRequestException for invalid service id', async () => {
      const req = { user: { id: 1 } };
      const linkDto: LinkServiceDto = {
        code: 'auth-code',
        platform: LinkPlatform.WEB,
      };

      await expect(
        controller.linkService(req, 'invalid', linkDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unlinkService', () => {
    it('should unlink a service', async () => {
      const req = { user: { id: 1 } };
      mockServicesService.unlinkService.mockResolvedValue(undefined);

      await controller.unlinkService(req, '1');

      expect(mockServicesService.unlinkService).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException for invalid service id', async () => {
      const req = { user: { id: 1 } };

      await expect(controller.unlinkService(req, 'invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh service token', async () => {
      const req = { user: { id: 1 } };
      mockServicesService.refreshServiceToken.mockResolvedValue(undefined);

      await controller.refreshToken(req, '1');

      expect(mockServicesService.refreshServiceToken).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it('should throw BadRequestException for invalid service id', async () => {
      const req = { user: { id: 1 } };

      await expect(controller.refreshToken(req, 'invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDiscordProfile', () => {
    it('should return Discord profile', async () => {
      const req = { user: { id: 1 } };
      const profile = {
        username: 'testuser',
        avatar: 'avatar-url',
        id: 'discord-id',
      };
      mockServicesService.getDiscordProfile.mockResolvedValue(profile);

      const result = await controller.getDiscordProfile(req);

      expect(result).toEqual(profile);
      expect(mockServicesService.getDiscordProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('getGitHubProfile', () => {
    it('should return GitHub profile', async () => {
      const req = { user: { id: 1 } };
      const profile = {
        id: 'github-id',
        login: 'testuser',
        avatar_url: 'avatar-url',
        email: 'test@example.com',
      };
      mockServicesService.getGitHubProfile.mockResolvedValue(profile);

      const result = await controller.getGitHubProfile(req);

      expect(result).toEqual(profile);
      expect(mockServicesService.getGitHubProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('getTwitchProfile', () => {
    it('should return Twitch profile', async () => {
      const req = { user: { id: 1 } };
      const profile = {
        id: 'twitch-id',
        login: 'testuser',
        display_name: 'Test User',
        profile_image_url: 'avatar-url',
        email: 'test@example.com',
      };
      mockServicesService.getTwitchProfile.mockResolvedValue(profile);

      const result = await controller.getTwitchProfile(req);

      expect(result).toEqual(profile);
      expect(mockServicesService.getTwitchProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('getTrelloProfile', () => {
    it('should return Trello profile', async () => {
      const req = { user: { id: 1 } };
      const profile = {
        id: 'trello-id',
        username: 'testuser',
        fullName: 'Test User',
        avatarUrl: 'avatar-url',
        email: 'test@example.com',
      };
      mockServicesService.getTrelloProfile.mockResolvedValue(profile);

      const result = await controller.getTrelloProfile(req);

      expect(result).toEqual(profile);
      expect(mockServicesService.getTrelloProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('getTrelloAuthUrl', () => {
    it('should return Trello auth URL', () => {
      const authUrl = { authUrl: 'https://trello.com/auth' };
      mockServicesService.getTrelloAuthUrl.mockReturnValue(authUrl);

      const result = controller.getTrelloAuthUrl();

      expect(result).toEqual(authUrl);
      expect(mockServicesService.getTrelloAuthUrl).toHaveBeenCalled();
    });
  });

  describe('disconnectService', () => {
    it('should disconnect a service', async () => {
      const req = { user: { id: 1 } };
      mockServicesService.disconnectService.mockResolvedValue(undefined);

      await controller.disconnectService(req, 'discord');

      expect(mockServicesService.disconnectService).toHaveBeenCalledWith(
        1,
        'discord',
      );
    });
  });

  // Note: oauth2Callback tests are skipped due to complex Express Response mocking
  // The method handles OAuth2 redirects with platform-specific URL generation
  // which would require extensive mocking of the Response object
});
