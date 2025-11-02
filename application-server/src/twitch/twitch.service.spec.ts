/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { TwitchService } from './twitch.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { UserServicesService } from '../services/user-services/user-services.service';
import { ServicesService } from '../services/services.service';
import { HookStatesService } from '../hook-states/hook-states.service';
import { AreasService } from '../areas/areas.service';
import { ReactionProcessorService } from '../common/reaction-processor.service';
import { Area } from '../areas/entities/area.entity';

describe('TwitchService', () => {
  let service: TwitchService;
  let mockAreaRepository: any;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockUserServicesService: any;
  let mockServicesService: any;
  let mockConfigService: any;
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

    mockConfigService = {
      get: jest.fn().mockReturnValue({
        oauth2: {
          twitch: {
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          },
        },
      }),
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
        TwitchService,
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

    service = module.get<TwitchService>(TwitchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkStreamersGoingLive', () => {
    it('should handle no areas to check', async () => {
      mockAreasService.findByActionComponent.mockResolvedValue([]);

      await service.checkStreamersGoingLive();

      expect(mockAreasService.findByActionComponent).toHaveBeenCalledWith(
        'streamer_goes_live',
      );
    });

    it('should handle errors gracefully', async () => {
      mockAreasService.findByActionComponent.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.checkStreamersGoingLive()).resolves.not.toThrow();
    });
  });
});
