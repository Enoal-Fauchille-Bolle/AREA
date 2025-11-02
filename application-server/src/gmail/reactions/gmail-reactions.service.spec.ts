/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GmailReactionsService } from './gmail-reactions.service';
import { AreaExecutionsService } from '../../area-executions/area-executions.service';
import { AreaParametersService } from '../../area-parameters/area-parameters.service';
import { UserServicesService } from '../../services/user-services/user-services.service';
import { ServicesService } from '../../services/services.service';
import { Area } from '../../areas/entities/area.entity';

describe('GmailReactionsService', () => {
  let service: GmailReactionsService;
  let mockAreaRepository: any;
  let mockAreaExecutionsService: any;
  let mockAreaParametersService: any;
  let mockUserServicesService: any;
  let mockServicesService: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailReactionsService,
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

    service = module.get<GmailReactionsService>(GmailReactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should handle missing area gracefully', async () => {
      mockAreaRepository.findOne.mockResolvedValue(null);

      await service.sendEmail(1, 1);

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

      await service.sendEmail(1, 1);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('not configured'),
      );
    });

    it('should handle missing user service token', async () => {
      mockAreaRepository.findOne.mockResolvedValue({
        id: 1,
        user_id: 1,
      });
      mockAreaParametersService.findByArea.mockResolvedValue([
        { variable: { name: 'to' }, value: 'test@example.com' },
        { variable: { name: 'subject' }, value: 'Test Subject' },
        { variable: { name: 'body' }, value: 'Test Body' },
      ]);
      mockServicesService.findAll.mockResolvedValue([{ id: 1, name: 'Gmail' }]);
      mockServicesService.findByName.mockResolvedValue({ id: 1 });
      mockUserServicesService.findByUserAndService.mockResolvedValue(null);

      await service.sendEmail(1, 1);

      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        expect.stringContaining('not connected'),
      );
    });
  });
});
