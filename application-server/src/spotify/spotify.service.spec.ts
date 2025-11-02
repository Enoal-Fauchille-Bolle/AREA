/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpotifyService } from './spotify.service';
import { AreaExecutionsService } from '../area-executions/area-executions.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { UserServicesService } from '../services/user-services/user-services.service';
import { ServicesService } from '../services/services.service';
import { Area } from '../areas/entities/area.entity';

describe('SpotifyService', () => {
  let service: SpotifyService;
  let mockAreaRepository: any;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockUserServicesService: any;
  let mockServicesService: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotifyService,
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
      ],
    }).compile();

    service = module.get<SpotifyService>(SpotifyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToPlaylist', () => {
    it('should handle missing parameters gracefully', async () => {
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue(
        [],
      );

      await expect(service.addToPlaylist(1, 1)).rejects.toThrow();
      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalled();
    });
  });

  describe('addToQueue', () => {
    it('should handle missing parameters gracefully', async () => {
      mockAreaParametersService.findByAreaWithInterpolation.mockResolvedValue(
        [],
      );

      await expect(service.addToQueue(1, 1)).rejects.toThrow();
      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalled();
    });
  });

  describe('processReaction', () => {
    it('should delegate to addToQueue', async () => {
      const addToQueueSpy = jest
        .spyOn(service, 'addToQueue')
        .mockResolvedValue();

      await service.processReaction(1, 1);

      expect(addToQueueSpy).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('addToPlaylistReaction', () => {
    it('should delegate to addToPlaylist', async () => {
      const addToPlaylistSpy = jest
        .spyOn(service, 'addToPlaylist')
        .mockResolvedValue();

      await service.addToPlaylistReaction(1, 1);

      expect(addToPlaylistSpy).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('addToQueueReaction', () => {
    it('should delegate to addToQueue', async () => {
      const addToQueueSpy = jest
        .spyOn(service, 'addToQueue')
        .mockResolvedValue();

      await service.addToQueueReaction(1, 1);

      expect(addToQueueSpy).toHaveBeenCalledWith(1, 1);
    });
  });
});
