import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AreaParametersService } from './area-parameters.service';
import { AreaParameter } from './entities/area-parameter.entity';
import { VariableInterpolationService } from '../common/variable-interpolation.service';

describe('AreaParametersService', () => {
  let service: AreaParametersService;
  let mockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    upsert: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockVariableInterpolationService: {
    interpolate: jest.Mock;
  };

  const mockAreaParameter = {
    area_id: 1,
    variable_id: 1,
    value: 'test value',
    variable: {
      id: 1,
      component_id: 1,
      name: 'test_var',
      description: 'Test variable',
      kind: 'input',
      type: 'string',
      nullable: false,
      placeholder: 'Enter value',
      validation_regex: null,
      display_order: 1,
    },
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      upsert: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockVariableInterpolationService = {
      interpolate: jest.fn((value: string) => value),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaParametersService,
        {
          provide: getRepositoryToken(AreaParameter),
          useValue: mockRepository,
        },
        {
          provide: VariableInterpolationService,
          useValue: mockVariableInterpolationService,
        },
      ],
    }).compile();

    service = module.get<AreaParametersService>(AreaParametersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new area parameter', async () => {
      const createDto = {
        area_id: 1,
        variable_id: 1,
        value: 'test value',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockAreaParameter);
      mockRepository.save.mockResolvedValue(mockAreaParameter);

      const result = await service.create(createDto);

      expect(result).toEqual({
        area_id: 1,
        variable_id: 1,
        value: 'test value',
        variable: mockAreaParameter.variable,
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { area_id: 1, variable_id: 1 },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if parameter already exists', async () => {
      const createDto = {
        area_id: 1,
        variable_id: 1,
        value: 'test value',
      };

      mockRepository.findOne.mockResolvedValue(mockAreaParameter);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Parameter for this area and variable combination already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return all area parameters', async () => {
      mockRepository.find.mockResolvedValue([mockAreaParameter]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].area_id).toBe(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['variable'],
        order: { area_id: 'ASC', variable_id: 'ASC' },
      });
    });
  });

  describe('findByArea', () => {
    it('should return parameters for a specific area', async () => {
      mockRepository.find.mockResolvedValue([mockAreaParameter]);

      const result = await service.findByArea(1);

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { area_id: 1 },
        relations: ['variable'],
        order: { variable_id: 'ASC' },
      });
    });
  });

  describe('findByVariable', () => {
    it('should return parameters for a specific variable', async () => {
      mockRepository.find.mockResolvedValue([mockAreaParameter]);

      const result = await service.findByVariable(1);

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { variable_id: 1 },
        relations: ['variable'],
        order: { area_id: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific area parameter', async () => {
      mockRepository.findOne.mockResolvedValue(mockAreaParameter);

      const result = await service.findOne(1, 1);

      expect(result.area_id).toBe(1);
      expect(result.variable_id).toBe(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { area_id: 1, variable_id: 1 },
        relations: ['variable'],
      });
    });

    it('should throw NotFoundException when parameter not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(1, 1)).rejects.toThrow(
        'AreaParameter for area 1 and variable 1 not found',
      );
    });
  });

  describe('findTemplates', () => {
    it('should return all template parameters', async () => {
      mockRepository.find.mockResolvedValue([mockAreaParameter]);

      const result = await service.findTemplates();

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['variable'],
        order: { area_id: 'ASC', variable_id: 'ASC' },
      });
    });
  });

  describe('findTemplatesByArea', () => {
    it('should return templates for a specific area', async () => {
      mockRepository.find.mockResolvedValue([mockAreaParameter]);

      const result = await service.findTemplatesByArea(1);

      expect(result).toHaveLength(1);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { area_id: 1 },
        relations: ['variable'],
        order: { variable_id: 'ASC' },
      });
    });
  });

  describe('update', () => {
    it('should update an area parameter', async () => {
      const updateDto = { value: 'updated value' };
      const updatedParam = { ...mockAreaParameter, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockAreaParameter);
      mockRepository.save.mockResolvedValue(updatedParam);

      const result = await service.update(1, 1, updateDto);

      expect(result.value).toBe('updated value');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when parameter not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, 1, { value: 'new' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateValue', () => {
    it('should update only the value of a parameter', async () => {
      const updatedParam = { ...mockAreaParameter, value: 'new value' };

      mockRepository.findOne.mockResolvedValue(mockAreaParameter);
      mockRepository.save.mockResolvedValue(updatedParam);

      const result = await service.updateValue(1, 1, 'new value');

      expect(result.value).toBe('new value');
    });

    it('should throw NotFoundException when parameter not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateValue(1, 1, 'new')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkCreateOrUpdate', () => {
    it('should bulk upsert multiple parameters', async () => {
      const parameters = [
        { variable_id: 1, value: 'value1' },
        { variable_id: 2, value: 'value2' },
      ];

      mockRepository.upsert.mockResolvedValue(undefined);
      mockRepository.find.mockResolvedValue([mockAreaParameter]);

      const result = await service.bulkCreateOrUpdate(1, parameters);

      expect(mockRepository.upsert).toHaveBeenCalledWith(
        [
          { area_id: 1, variable_id: 1, value: 'value1', is_template: false },
          { area_id: 1, variable_id: 2, value: 'value2', is_template: false },
        ],
        ['area_id', 'variable_id'],
      );
      expect(result).toHaveLength(1);
    });

    it('should handle is_template flag in bulk upsert', async () => {
      const parameters = [
        { variable_id: 1, value: 'value1', is_template: true },
      ];

      mockRepository.upsert.mockResolvedValue(undefined);
      mockRepository.find.mockResolvedValue([mockAreaParameter]);

      await service.bulkCreateOrUpdate(1, parameters);

      expect(mockRepository.upsert).toHaveBeenCalledWith(
        [{ area_id: 1, variable_id: 1, value: 'value1', is_template: true }],
        ['area_id', 'variable_id'],
      );
    });
  });

  describe('remove', () => {
    it('should remove an area parameter', async () => {
      mockRepository.findOne.mockResolvedValue(mockAreaParameter);
      mockRepository.remove.mockResolvedValue(mockAreaParameter);

      await service.remove(1, 1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockAreaParameter);
    });

    it('should throw NotFoundException when parameter not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeByArea', () => {
    it('should remove all parameters for an area', async () => {
      mockRepository.find.mockResolvedValue([mockAreaParameter]);
      mockRepository.remove.mockResolvedValue([mockAreaParameter]);

      await service.removeByArea(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { area_id: 1 },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith([mockAreaParameter]);
    });

    it('should not throw when no parameters found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.removeByArea(1)).resolves.not.toThrow();
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('removeByVariable', () => {
    it('should remove all parameters for a variable', async () => {
      mockRepository.find.mockResolvedValue([mockAreaParameter]);
      mockRepository.remove.mockResolvedValue([mockAreaParameter]);

      await service.removeByVariable(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { variable_id: 1 },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith([mockAreaParameter]);
    });

    it('should not throw when no parameters found', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.removeByVariable(1)).resolves.not.toThrow();
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findByAreaWithInterpolation', () => {
    it('should return parameters with interpolated values', async () => {
      const executionContext = { username: 'john', id: 123 };
      mockRepository.find.mockResolvedValue([
        { ...mockAreaParameter, value: 'Hello {{username}}' },
      ]);
      mockVariableInterpolationService.interpolate.mockReturnValue(
        'Hello john',
      );

      const result = await service.findByAreaWithInterpolation(
        1,
        executionContext,
      );

      expect(result[0].value).toBe('Hello john');
      expect(mockVariableInterpolationService.interpolate).toHaveBeenCalledWith(
        'Hello {{username}}',
        executionContext,
      );
    });

    it('should work with empty execution context', async () => {
      const freshMockParam = {
        area_id: 1,
        variable_id: 1,
        value: 'test value',
        variable: {
          id: 1,
          component_id: 1,
          name: 'test_var',
          description: 'Test variable',
          kind: 'input',
          type: 'string',
          nullable: false,
          placeholder: 'Enter value',
          validation_regex: null,
          display_order: 1,
        },
      };
      mockRepository.find.mockResolvedValue([freshMockParam]);

      const result = await service.findByAreaWithInterpolation(1);

      expect(result).toHaveLength(1);
      expect(mockVariableInterpolationService.interpolate).toHaveBeenCalledWith(
        'test value',
        {},
      );
    });
  });
});
