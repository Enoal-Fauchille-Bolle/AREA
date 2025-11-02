/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrelloService } from './trello.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { UserServicesService } from '../services/user-services/user-services.service';
import { ServicesService } from '../services/services.service';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreasService } from '../areas/areas.service';
import { ReactionProcessorService } from '../common/reaction-processor.service';
import { Area } from '../areas/entities/area.entity';

describe('TrelloService', () => {
  let service: TrelloService;
  let mockAreaRepository: any;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockUserServicesService: any;
  let mockServicesService: any;
  let mockHookStatesService: any;
  let mockAreasService: any;
  let mockReactionProcessorService: any;

  beforeEach(async () => {
    mockAreaRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockAreaExecutionsService = {
      findOne: jest.fn(),
      create: jest.fn(),
      completeExecution: jest.fn(),
      failExecution: jest.fn(),
    };

    mockAreaParametersService = {
      findByArea: jest.fn(),
      findByAreaWithInterpolation: jest.fn(),
    };

    mockUserServicesService = {
      findByUserAndService: jest.fn(),
    };

    mockServicesService = {
      findByName: jest.fn(),
    };

    mockHookStatesService = {
      getState: jest.fn(),
      setState: jest.fn(),
    };

    mockAreasService = {
      findByActionComponent: jest.fn(),
    };

    mockReactionProcessorService = {
      processReaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrelloService,
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
          provide: HookStatesService,
          useValue: mockHookStatesService,
        },
        {
          provide: AreasService,
          useValue: mockAreasService,
        },
        {
          provide: ReactionProcessorService,
          useValue: mockReactionProcessorService,
        },
      ],
    }).compile();

    service = module.get<TrelloService>(TrelloService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkNewCards', () => {
    it('should handle no areas to check', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([]);

      await service.checkNewCards();

      expect(mockAreasService.findByActionComponent).toHaveBeenCalledWith(
        'new_card_in_list',
      );
    });

    it('should handle errors gracefully', async () => {
      mockAreasService.findByActionComponent.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.checkNewCards()).resolves.not.toThrow();
    });
  });

  describe('checkCardMoves', () => {
    it('should handle no areas to check', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([]);

      await service.checkCardMoves();

      expect(mockAreasService.findByActionComponent).toHaveBeenCalledWith(
        'card_moved_to_list',
      );
    });

    it('should handle errors gracefully', async () => {
      mockAreasService.findByActionComponent.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.checkCardMoves()).resolves.not.toThrow();
    });
  });
});
