/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesInitializerService } from './services-initializer.service';
import { ServicesService } from './services.service';
import { ComponentsService } from '../components/components.service';
import { VariablesService } from '../variables/variables.service';

describe('ServicesInitializerService', () => {
  let service: ServicesInitializerService;
  let mockServicesService: any;
  let mockComponentsService: any;
  let mockVariablesService: any;

  beforeEach(async () => {
    mockServicesService = {
      findByName: jest.fn(),
      create: jest.fn(),
    };

    mockComponentsService = {
      create: jest.fn(),
    };

    mockVariablesService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesInitializerService,
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
        {
          provide: ComponentsService,
          useValue: mockComponentsService,
        },
        {
          provide: VariablesService,
          useValue: mockVariablesService,
        },
      ],
    }).compile();

    service = module.get<ServicesInitializerService>(
      ServicesInitializerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should initialize all default services', async () => {
      let callCount = 0;
      // Mock findByName to throw first time (service doesn't exist), then return created service
      mockServicesService.findByName.mockImplementation((name: string) => {
        callCount++;
        // First call per service: doesn't exist, throw error
        if (callCount % 2 === 1) {
          throw new Error('Service not found');
        }
        // Second call per service: return the created service
        return Promise.resolve({ id: callCount, name });
      });
      mockServicesService.create.mockResolvedValue({ id: 1 });
      mockComponentsService.create.mockResolvedValue({ id: 1 });
      mockVariablesService.create.mockResolvedValue({ id: 1 });

      await service.onApplicationBootstrap();

      expect(mockServicesService.create).toHaveBeenCalled();
    });
  });

  describe('Service Creation', () => {
    it('should skip creating existing services', async () => {
      mockServicesService.findByName.mockResolvedValue({ id: 1 });

      await service.onApplicationBootstrap();

      expect(mockServicesService.create).not.toHaveBeenCalled();
    });

    it('should create all services when none exist', async () => {
      let callCount = 0;
      mockServicesService.findByName.mockImplementation((name: string) => {
        callCount++;
        // First call per service: doesn't exist, throw error
        if (callCount % 2 === 1) {
          throw new Error('Not found');
        }
        // Second call per service: return the created service
        return Promise.resolve({ id: callCount, name });
      });
      mockServicesService.create.mockResolvedValue({ id: 1 });
      mockComponentsService.create.mockResolvedValue({ id: 1 });
      mockVariablesService.create.mockResolvedValue({ id: 1 });

      await service.onApplicationBootstrap();

      // Should create all default services
      expect(mockServicesService.create).toHaveBeenCalled();
      expect(mockServicesService.create.mock.calls.length).toBeGreaterThan(5);
    });

    it('should create components and variables for services', async () => {
      let callCount = 0;
      mockServicesService.findByName.mockImplementation((name: string) => {
        callCount++;
        // First call per service: doesn't exist, throw error
        if (callCount % 2 === 1) {
          throw new Error('Not found');
        }
        // Second call per service: return the created service
        return Promise.resolve({ id: callCount, name });
      });
      mockServicesService.create.mockResolvedValue({ id: 1 });
      mockComponentsService.create.mockResolvedValue({ id: 1 });
      mockVariablesService.create.mockResolvedValue({ id: 1 });

      await service.onApplicationBootstrap();

      expect(mockComponentsService.create).toHaveBeenCalled();
      expect(mockVariablesService.create).toHaveBeenCalled();
    });
  });
});
