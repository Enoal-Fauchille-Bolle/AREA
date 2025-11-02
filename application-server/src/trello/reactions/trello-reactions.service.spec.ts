/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrelloReactionsService } from './trello-reactions.service';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';
import { UserServicesService } from '../../services/user-services/user-services.service';
import { ServicesService } from '../../services/services.service';
import { Area } from '../../areas/entities/area.entity';

// Mock fetch globally
global.fetch = jest.fn();

describe('TrelloReactionsService', () => {
  let service: TrelloReactionsService;
  let mockAreaRepository: any;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockUserServicesService: any;
  let mockServicesService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockAreaRepository = {
      findOne: jest.fn(),
      findAll: jest.fn(),
    };

    mockAreaExecutionsService = {
      completeExecution: jest.fn(),
      failExecution: jest.fn(),
      findOne: jest.fn(),
    };

    mockAreaParametersService = {
      findByAreaWithInterpolation: jest.fn(),
    };

    mockUserServicesService = {
      findOne: jest.fn(),
    };

    mockServicesService = {
      findAll: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue({
        oauth2: {
          trello: {
            apiKey: 'test-api-key',
          },
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrelloReactionsService,
        {
          provide: getRepositoryToken(Area),
          useValue: mockAreaRepository,
        },
        {
          provide: AreaExecutionsService,
          useValue: mockAreaExecutionsService,
        },
        {
          provide: AreaParametersService,
          useValue: mockAreaParametersService,
        },
        {
          provide: UserServicesService,
          useValue: mockUserServicesService,
        },
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

    service = module.get<TrelloReactionsService>(TrelloReactionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCard', () => {
    it('should create Trello card successfully', async () => {
      const executionId = 1;
      const areaId = 10;

      mockAreaRepository.findOne.mockResolvedValue({
        id: areaId,
        user_id: 5,
      });

      mockServicesService.findAll.mockResolvedValue([
        { id: 3, name: 'Trello' },
      ]);

      mockUserServicesService.findOne.mockResolvedValue({
        oauth_token: 'test-token',
      });

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'list_id' }, value: 'list123' },
        { variable: { name: 'card_name' }, value: 'New Task' },
        { variable: { name: 'card_description' }, value: 'Task description' },
      ]);

      const mockCardResponse = {
        id: 'card123',
        name: 'New Task',
        url: 'https://trello.com/c/card123',
        idList: 'list123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCardResponse,
      });

      await service.createCard(executionId, areaId);

      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        executionId,
        expect.objectContaining({
          executionResult: expect.objectContaining({
            card_id: 'card123',
            card_name: 'New Task',
          }),
        }),
      );
    });

    it('should fail when area is not found', async () => {
      mockAreaRepository.findOne.mockResolvedValue(null);

      await service.createCard(1, 10);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('Area with ID'),
      );
    });

    it('should fail when parameters are missing', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 10,
        user_id: 5,
      });

      mockServicesService.findAll.mockResolvedValue([
        { id: 3, name: 'Trello' },
      ]);

      mockUserServicesService.findOne.mockResolvedValue({
        oauth_token: 'test-token',
      });

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue(
        [],
      );

      await service.createCard(1, 10);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.any(String),
      );
    });

    it('should fail when Trello API returns error', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 10,
        user_id: 5,
      });

      mockServicesService.findAll.mockResolvedValue([
        { id: 3, name: 'Trello' },
      ]);

      mockUserServicesService.findOne.mockResolvedValue({
        oauth_token: 'test-token',
      });

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'list_id' }, value: 'list123' },
        { variable: { name: 'card_name' }, value: 'New Task' },
      ]);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid token',
      });

      await service.createCard(1, 10);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.any(String),
      );
    });
  });

  describe('moveCard', () => {
    it('should move Trello card successfully', async () => {
      const executionId = 2;
      const areaId = 11;

      mockAreaRepository.findOne.mockResolvedValue({
        id: areaId,
        user_id: 5,
      });

      mockServicesService.findAll.mockResolvedValue([
        { id: 3, name: 'Trello' },
      ]);

      mockUserServicesService.findOne.mockResolvedValue({
        oauth_token: 'test-token',
      });

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'card_id' }, value: 'card456' },
        { variable: { name: 'target_list_id' }, value: 'list789' },
      ]);

      const mockCardResponse = {
        id: 'card456',
        name: 'Moved Task',
        url: 'https://trello.com/c/card456',
        idList: 'list789',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCardResponse,
      });

      await service.moveCard(executionId, areaId);

      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        executionId,
        expect.objectContaining({
          executionResult: expect.objectContaining({
            card_id: 'card456',
            target_list_id: 'list789',
          }),
        }),
      );
    });

    it('should fail when move parameters are missing', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 11,
        user_id: 5,
      });

      mockServicesService.findAll.mockResolvedValue([
        { id: 3, name: 'Trello' },
      ]);

      mockUserServicesService.findOne.mockResolvedValue({
        oauth_token: 'test-token',
      });

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'card_id' }, value: 'card456' },
      ]);

      await service.moveCard(2, 11);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        2,
        expect.any(String),
      );
    });
  });

  describe('processReaction', () => {
    it('should call createCard for create_card component', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 10,
        user_id: 5,
        componentReaction: { name: 'create_card' },
      });

      mockServicesService.findAll.mockResolvedValue([
        { id: 3, name: 'Trello' },
      ]);

      mockUserServicesService.findOne.mockResolvedValue({
        oauth_token: 'test-token',
      });

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'list_id' }, value: 'list123' },
        { variable: { name: 'card_name' }, value: 'Test' },
      ]);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'card123',
          name: 'Test',
          url: 'https://trello.com/c/card123',
          idList: 'list123',
        }),
      });

      await service.processReaction(1, 10);

      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalled();
    });

    it('should call moveCard for move_card component', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 10,
        user_id: 5,
        componentReaction: { name: 'move_card' },
      });

      mockServicesService.findAll.mockResolvedValue([
        { id: 3, name: 'Trello' },
      ]);

      mockUserServicesService.findOne.mockResolvedValue({
        oauth_token: 'test-token',
      });

      mockAreaExecutionsService.findOne.mockResolvedValue({
        triggerData: {},
      });

      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue([
        { variable: { name: 'card_id' }, value: 'card456' },
        { variable: { name: 'target_list_id' }, value: 'list789' },
      ]);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'card456',
          name: 'Moved',
          url: 'https://trello.com/c/card456',
          idList: 'list789',
        }),
      });

      await service.processReaction(1, 10);

      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalled();
    });

    it('should fail for unknown component', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 10,
        user_id: 5,
        componentReaction: { name: 'unknown_action' },
      });

      await expect(service.processReaction(1, 10)).rejects.toThrow(
        'Unknown Trello reaction',
      );
    });
  });
});
