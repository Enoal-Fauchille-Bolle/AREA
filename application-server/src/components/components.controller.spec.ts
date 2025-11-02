import { Test, TestingModule } from '@nestjs/testing';
import { ComponentsController } from './components.controller';
import { ComponentsService } from './components.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { ComponentResponseDto } from './dto/component-response.dto';
import { ComponentType } from './entities/component.entity';

describe('ComponentsController', () => {
  let controller: ComponentsController;
  let _service: ComponentsService;

  const mockComponentResponse: ComponentResponseDto = {
    id: 1,
    service_id: 1,
    kind: ComponentType.ACTION,
    name: 'test_action',
    description: 'Test action',
    is_active: true,
    webhook_endpoint: '/webhook',
    polling_interval: null,
  };

  const mockReactionResponse: ComponentResponseDto = {
    id: 2,
    service_id: 1,
    kind: ComponentType.REACTION,
    name: 'test_reaction',
    description: 'Test reaction',
    is_active: true,
    webhook_endpoint: null,
    polling_interval: null,
  };

  const mockComponentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByService: jest.fn(),
    findByType: jest.fn(),
    findByServiceAndType: jest.fn(),
    findActive: jest.fn(),
    findActions: jest.fn(),
    findReactions: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComponentsController],
      providers: [
        {
          provide: ComponentsService,
          useValue: mockComponentsService,
        },
      ],
    }).compile();

    controller = module.get<ComponentsController>(ComponentsController);
    _service = module.get<ComponentsService>(ComponentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateComponentDto = {
      service_id: 1,
      type: ComponentType.ACTION,
      name: 'new_action',
      description: 'New action',
      is_active: true,
      webhook_endpoint: '/webhook',
      polling_interval: undefined,
    };

    it('should create a new component', async () => {
      mockComponentsService.create.mockResolvedValue(mockComponentResponse);

      const result = await controller.create(createDto);

      expect(mockComponentsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockComponentResponse);
    });
  });

  describe('findAll', () => {
    it('should return all components when no query params', async () => {
      mockComponentsService.findAll.mockResolvedValue([
        mockComponentResponse,
        mockReactionResponse,
      ]);

      const result = await controller.findAll();

      expect(mockComponentsService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return only active components when active=true', async () => {
      mockComponentsService.findActive.mockResolvedValue([
        mockComponentResponse,
      ]);

      const result = await controller.findAll(undefined, undefined, 'true');

      expect(mockComponentsService.findActive).toHaveBeenCalled();
      expect(mockComponentsService.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by type and service_id', async () => {
      mockComponentsService.findByServiceAndType.mockResolvedValue([
        mockComponentResponse,
      ]);

      const result = await controller.findAll('action', '1');

      expect(mockComponentsService.findByServiceAndType).toHaveBeenCalledWith(
        1,
        ComponentType.ACTION,
      );
      expect(result).toHaveLength(1);
    });

    it('should return actions when type=action', async () => {
      mockComponentsService.findActions.mockResolvedValue([
        mockComponentResponse,
      ]);

      const result = await controller.findAll('action');

      expect(mockComponentsService.findActions).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return reactions when type=reaction', async () => {
      mockComponentsService.findReactions.mockResolvedValue([
        mockReactionResponse,
      ]);

      const result = await controller.findAll('reaction');

      expect(mockComponentsService.findReactions).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by service_id only', async () => {
      mockComponentsService.findByService.mockResolvedValue([
        mockComponentResponse,
        mockReactionResponse,
      ]);

      const result = await controller.findAll(undefined, '1');

      expect(mockComponentsService.findByService).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('should handle active=false (returns all)', async () => {
      mockComponentsService.findAll.mockResolvedValue([
        mockComponentResponse,
        mockReactionResponse,
      ]);

      await controller.findAll(undefined, undefined, 'false');

      expect(mockComponentsService.findAll).toHaveBeenCalled();
      expect(mockComponentsService.findActive).not.toHaveBeenCalled();
    });
  });

  describe('findActions', () => {
    it('should return all action components', async () => {
      mockComponentsService.findActions.mockResolvedValue([
        mockComponentResponse,
      ]);

      const result = await controller.findActions();

      expect(mockComponentsService.findActions).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.ACTION);
    });
  });

  describe('findReactions', () => {
    it('should return all reaction components', async () => {
      mockComponentsService.findReactions.mockResolvedValue([
        mockReactionResponse,
      ]);

      const result = await controller.findReactions();

      expect(mockComponentsService.findReactions).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.REACTION);
    });
  });

  describe('findActive', () => {
    it('should return only active components', async () => {
      mockComponentsService.findActive.mockResolvedValue([
        mockComponentResponse,
      ]);

      const result = await controller.findActive();

      expect(mockComponentsService.findActive).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].is_active).toBe(true);
    });
  });

  describe('findByService', () => {
    it('should return components for a specific service', async () => {
      mockComponentsService.findByService.mockResolvedValue([
        mockComponentResponse,
        mockReactionResponse,
      ]);

      const result = await controller.findByService(1);

      expect(mockComponentsService.findByService).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });

  describe('findActionsByService', () => {
    it('should return actions for a specific service', async () => {
      mockComponentsService.findByServiceAndType.mockResolvedValue([
        mockComponentResponse,
      ]);

      const result = await controller.findActionsByService(1);

      expect(mockComponentsService.findByServiceAndType).toHaveBeenCalledWith(
        1,
        ComponentType.ACTION,
      );
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.ACTION);
    });
  });

  describe('findReactionsByService', () => {
    it('should return reactions for a specific service', async () => {
      mockComponentsService.findByServiceAndType.mockResolvedValue([
        mockReactionResponse,
      ]);

      const result = await controller.findReactionsByService(1);

      expect(mockComponentsService.findByServiceAndType).toHaveBeenCalledWith(
        1,
        ComponentType.REACTION,
      );
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(ComponentType.REACTION);
    });
  });

  describe('findOne', () => {
    it('should return a component by id', async () => {
      mockComponentsService.findOne.mockResolvedValue(mockComponentResponse);

      const result = await controller.findOne(1);

      expect(mockComponentsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockComponentResponse);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new Error('Component with ID 999 not found');
      mockComponentsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(999)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    const updateDto: UpdateComponentDto = {
      name: 'updated_name',
      description: 'Updated description',
    };

    it('should update a component', async () => {
      const updatedComponent = {
        ...mockComponentResponse,
        ...updateDto,
      };
      mockComponentsService.update.mockResolvedValue(updatedComponent);

      const result = await controller.update(1, updateDto);

      expect(mockComponentsService.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new Error('Component with ID 999 not found');
      mockComponentsService.update.mockRejectedValue(error);

      await expect(controller.update(999, updateDto)).rejects.toThrow(error);
    });

    it('should update only provided fields', async () => {
      const partialUpdate: UpdateComponentDto = {
        is_active: false,
      };

      const updatedComponent = {
        ...mockComponentResponse,
        is_active: false,
      };

      mockComponentsService.update.mockResolvedValue(updatedComponent);

      const result = await controller.update(1, partialUpdate);

      expect(result.is_active).toBe(false);
      expect(result.name).toBe(mockComponentResponse.name);
    });
  });

  describe('remove', () => {
    it('should remove a component', async () => {
      mockComponentsService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockComponentsService.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new Error('Component with ID 999 not found');
      mockComponentsService.remove.mockRejectedValue(error);

      await expect(controller.remove(999)).rejects.toThrow(error);
    });
  });

  describe('ParseIntPipe validation', () => {
    it('should handle ParseIntPipe for findOne', async () => {
      mockComponentsService.findOne.mockResolvedValue(mockComponentResponse);

      // ParseIntPipe is handled by NestJS, so we just verify the service is called with number
      await controller.findOne(1);

      expect(mockComponentsService.findOne).toHaveBeenCalledWith(1);
    });

    it('should handle ParseIntPipe for findByService', async () => {
      mockComponentsService.findByService.mockResolvedValue([
        mockComponentResponse,
      ]);

      await controller.findByService(1);

      expect(mockComponentsService.findByService).toHaveBeenCalledWith(1);
    });
  });
});
