/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { TwitchReactionsService } from './twitch-reactions.service';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';
import { UserServicesService } from '../../services/user-services/user-services.service';
import { ServicesService } from '../../services/services.service';
import { Area } from '../../areas/entities/area.entity';

describe('TwitchReactionsService', () => {
  let service: TwitchReactionsService;
  let mockAreaRepository: any;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockUserServicesService: any;
  let mockServicesService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockAreaRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
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
      findOne: jest.fn(),
    };

    mockServicesService = {
      findByName: jest.fn(),
      findAll: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitchReactionsService,
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

    service = module.get<TwitchReactionsService>(TwitchReactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendChatMessage', () => {
    it('should handle missing area gracefully', async () => {
      mockAreaRepository.findOne.mockResolvedValue(null);

      await service.sendChatMessage(1, 1);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('not found'),
      );
    });

    it('should handle missing parameters gracefully', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 1,
        user_id: 1,
      });
      mockAreaParametersService.findByArea.mockResolvedValue([]);

      await service.sendChatMessage(1, 1);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('not configured'),
      );
    });

    it('should handle errors during processing', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 1,
        user_id: 1,
      });
      mockAreaParametersService.findByArea.mockResolvedValue([
        { variable: { name: 'broadcaster_id' }, value: 'teststreamer' },
        { variable: { name: 'message' }, value: 'Test message' },
      ]);

      await service.sendChatMessage(1, 1);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.any(String),
      );
    });
  });
});
