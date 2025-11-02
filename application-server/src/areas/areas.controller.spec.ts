import { Test, TestingModule } from '@nestjs/testing';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AreasController', () => {
  let controller: AreasController;
  let mockAreasService: {
    create: jest.Mock;
    createWithParameters: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    toggleActive: jest.Mock;
  };

  const mockArea = {
    id: 1,
    user_id: 1,
    component_action_id: 1,
    component_reaction_id: 2,
    name: 'Test Area',
    description: 'Test description',
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    last_triggered_at: null,
    triggered_count: 0,
  };

  beforeEach(async () => {
    mockAreasService = {
      create: jest.fn(),
      createWithParameters: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      toggleActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreasController],
      providers: [
        {
          provide: AreasService,
          useValue: mockAreasService,
        },
      ],
    }).compile();

    controller = module.get<AreasController>(AreasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createAreaDto: CreateAreaDto = {
      component_action_id: 1,
      component_reaction_id: 2,
      name: 'New Area',
      description: 'Test description',
      is_active: true,
    };

    it('should create an area', async () => {
      const req = { user: { id: 1 } };
      mockAreasService.create.mockResolvedValue(mockArea);

      const result = await controller.create(req, createAreaDto);

      expect(result).toEqual(mockArea);
      expect(mockAreasService.create).toHaveBeenCalledWith(1, createAreaDto);
    });

    it('should handle create-with-parameters format', async () => {
      const req = { user: { id: 1 } };
      const bodyWithParameters = {
        area: createAreaDto,
        parameters: { param1: 'value1', param2: 'value2' },
      };
      mockAreasService.createWithParameters.mockResolvedValue(mockArea);

      const result = await controller.create(req, bodyWithParameters);

      expect(result).toEqual(mockArea);
      expect(mockAreasService.createWithParameters).toHaveBeenCalledWith(
        1,
        createAreaDto,
        bodyWithParameters.parameters,
      );
    });

    it('should return error when user is not authenticated', async () => {
      const req = { user: { id: undefined } };

      // @ts-expect-error Testing invalid user authentication
      const result = await controller.create(req, createAreaDto);

      expect(result).toHaveProperty('error', 'User not authenticated');
      expect(result).toHaveProperty('stack');
    });

    it('should return error object on service error', async () => {
      const req = { user: { id: 1 } };
      const error = new Error('Service error');
      mockAreasService.create.mockRejectedValue(error);

      const result = await controller.create(req, createAreaDto);

      expect(result).toHaveProperty('error', 'Service error');
      expect(result).toHaveProperty('stack');
    });
  });

  describe('createWithParameters', () => {
    const createAreaDto: CreateAreaDto = {
      component_action_id: 1,
      component_reaction_id: 2,
      name: 'New Area',
    };

    const parameters = { param1: 'value1', param2: 'value2' };

    it('should create an area with parameters', async () => {
      const req = { user: { id: 1 } };
      mockAreasService.createWithParameters.mockResolvedValue(mockArea);

      const result = await controller.createWithParameters(req, {
        area: createAreaDto,
        parameters,
      });

      expect(result).toEqual(mockArea);
      expect(mockAreasService.createWithParameters).toHaveBeenCalledWith(
        1,
        createAreaDto,
        parameters,
      );
    });

    it('should return error when user is not authenticated', async () => {
      const req = { user: { id: undefined } };

      const result = await controller.createWithParameters(
        // @ts-expect-error Testing invalid user authentication
        req,
        {
          area: createAreaDto,
          parameters,
        },
      );

      expect(result).toHaveProperty('error', 'User not authenticated');
      expect(result).toHaveProperty('stack');
    });

    it('should return error object on service error', async () => {
      const req = { user: { id: 1 } };
      const error = new Error('Parameter error');
      mockAreasService.createWithParameters.mockRejectedValue(error);

      const result = await controller.createWithParameters(req, {
        area: createAreaDto,
        parameters,
      });

      expect(result).toHaveProperty('error', 'Parameter error');
      expect(result).toHaveProperty('stack');
    });
  });

  describe('findAll', () => {
    it('should return all areas for a user', async () => {
      const req = { user: { id: 1 } };
      const mockAreas = [mockArea];
      mockAreasService.findAll.mockResolvedValue(mockAreas);

      const result = await controller.findAll(req);

      expect(result).toEqual(mockAreas);
      expect(mockAreasService.findAll).toHaveBeenCalledWith(1);
    });

    it('should return error when user is not authenticated', async () => {
      const req = { user: { id: undefined } };

      // @ts-expect-error Testing invalid user authentication
      const result = await controller.findAll(req);

      expect(result).toHaveProperty('error', 'User not authenticated');
    });

    it('should return error object on service error', async () => {
      const req = { user: { id: 1 } };
      const error = new Error('Database error');
      mockAreasService.findAll.mockRejectedValue(error);

      const result = await controller.findAll(req);

      expect(result).toHaveProperty('error', 'Database error');
    });
  });

  describe('findOne', () => {
    it('should return a single area', async () => {
      const req = { user: { id: 1 } };
      mockAreasService.findOne.mockResolvedValue(mockArea);

      const result = await controller.findOne('1', req);

      expect(result).toEqual(mockArea);
      expect(mockAreasService.findOne).toHaveBeenCalledWith(1, 1);
    });

    it('should return error when user is not authenticated', async () => {
      const req = { user: { id: undefined } };

      // @ts-expect-error Testing invalid user authentication
      const result = await controller.findOne('1', req);

      expect(result).toHaveProperty('error', 'User not authenticated');
    });

    it('should return error for invalid id format', async () => {
      const req = { user: { id: 1 } };

      const result = await controller.findOne('invalid', req);

      expect(result).toHaveProperty('error', 'Invalid ID format');
    });

    it('should return error for NaN id', async () => {
      const req = { user: { id: 1 } };

      const result = await controller.findOne('abc', req);

      expect(result).toHaveProperty('error', 'Invalid ID format');
    });

    it('should return error object on service error', async () => {
      const req = { user: { id: 1 } };
      const error = new Error('Not found');
      mockAreasService.findOne.mockRejectedValue(error);

      const result = await controller.findOne('1', req);

      expect(result).toHaveProperty('error', 'Not found');
    });
  });

  describe('update', () => {
    const updateAreaDto: UpdateAreaDto = {
      name: 'Updated Area',
      description: 'Updated description',
    };

    it('should update an area', async () => {
      const req = { user: { id: 1 } };
      const updatedArea = { ...mockArea, ...updateAreaDto };
      mockAreasService.update.mockResolvedValue(updatedArea);

      const result = await controller.update('1', req, updateAreaDto);

      expect(result).toBeInstanceOf(AreaResponseDto);
      expect(result.name).toBe('Updated Area');
      expect(mockAreasService.update).toHaveBeenCalledWith(1, 1, updateAreaDto);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const req = { user: { id: undefined } };

      await expect(
        // @ts-expect-error Testing invalid user authentication
        controller.update('1', req, updateAreaDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for invalid id format', async () => {
      const req = { user: { id: 1 } };

      await expect(
        controller.update('invalid', req, updateAreaDto),
      ).rejects.toThrow('Invalid ID format');
    });
  });

  describe('remove', () => {
    it('should remove an area', async () => {
      const req = { user: { id: 1 } };
      mockAreasService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1', req);

      expect(result).toEqual({ message: 'Area deleted successfully' });
      expect(mockAreasService.remove).toHaveBeenCalledWith(1, 1);
    });

    it('should return error when user is not authenticated', async () => {
      const req = { user: { id: undefined } };

      // @ts-expect-error Testing invalid user authentication
      const result = await controller.remove('1', req);

      expect(result).toHaveProperty('error', 'User not authenticated');
    });

    it('should return error for invalid id format', async () => {
      const req = { user: { id: 1 } };

      const result = await controller.remove('invalid', req);

      expect(result).toHaveProperty('error', 'Invalid ID format');
    });

    it('should return error object on service error', async () => {
      const req = { user: { id: 1 } };
      const error = new Error('Failed to delete');
      mockAreasService.remove.mockRejectedValue(error);

      const result = await controller.remove('1', req);

      expect(result).toHaveProperty('error', 'Failed to delete');
    });
  });

  describe('toggleActive', () => {
    it('should toggle area active status', async () => {
      const req = { user: { id: 1 } };
      const toggledArea = { ...mockArea, is_active: false };
      mockAreasService.toggleActive.mockResolvedValue(toggledArea);

      const result = await controller.toggleActive('1', req);

      expect(result).toBeInstanceOf(AreaResponseDto);
      expect(result.is_active).toBe(false);
      expect(mockAreasService.toggleActive).toHaveBeenCalledWith(1, 1);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const req = { user: { id: undefined } };

      // @ts-expect-error Testing invalid user authentication
      await expect(controller.toggleActive('1', req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error for invalid id format', async () => {
      const req = { user: { id: 1 } };

      await expect(controller.toggleActive('invalid', req)).rejects.toThrow(
        'Invalid ID format',
      );
    });
  });
});
