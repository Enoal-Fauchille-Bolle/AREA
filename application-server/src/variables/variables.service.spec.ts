import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { VariablesService } from './variables.service';
import {
  Variable,
  VariableKind,
  VariableType,
} from './entities/variable.entity';
import { CreateVariableDto } from './dto/create-variable.dto';
import { UpdateVariableDto } from './dto/update-variable.dto';
import {
  Component,
  ComponentType,
} from '../components/entities/component.entity';

describe('VariablesService', () => {
  let service: VariablesService;
  let _repository: Repository<Variable>;

  const mockComponent: Component = {
    id: 1,
    service_id: 1,
    type: ComponentType.ACTION,
    name: 'test_action',
    description: 'Test action',
    is_active: true,
    webhook_endpoint: null,
    polling_interval: null,
    service: {
      id: 1,
      name: 'TestService',
      description: 'Test service',
      icon_path: null,
      requires_auth: false,
      is_active: true,
    },
  };

  const mockParameter: Variable = {
    id: 1,
    component_id: 1,
    name: 'channel_id',
    description: 'The channel ID',
    kind: VariableKind.PARAMETER,
    type: VariableType.STRING,
    nullable: false,
    placeholder: 'Enter channel ID',
    validation_regex: '^[0-9]+$',
    display_order: 1,
    component: mockComponent,
  };

  const mockReturnValue: Variable = {
    id: 2,
    component_id: 1,
    name: 'message_content',
    description: 'The message content',
    kind: VariableKind.RETURN_VALUE,
    type: VariableType.STRING,
    nullable: true,
    placeholder: null,
    validation_regex: null,
    display_order: 1,
    component: mockComponent,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariablesService,
        {
          provide: getRepositoryToken(Variable),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VariablesService>(VariablesService);
    _repository = module.get<Repository<Variable>>(
      getRepositoryToken(Variable),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createVariableDto: CreateVariableDto = {
      component_id: 1,
      name: 'test_var',
      description: 'Test variable',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: 'Enter value',
      validation_regex: undefined,
      display_order: 1,
    };

    it('should create a new variable', async () => {
      mockRepository.create.mockReturnValue(mockParameter);
      mockRepository.save.mockResolvedValue(mockParameter);

      const result = await service.create(createVariableDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createVariableDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockParameter.id,
        component_id: mockParameter.component_id,
        name: mockParameter.name,
        description: mockParameter.description,
        kind: mockParameter.kind,
        type: mockParameter.type,
        optional: mockParameter.nullable,
        placeholder: mockParameter.placeholder,
        validation_regex: mockParameter.validation_regex,
        display_order: mockParameter.display_order,
      });
    });

    it('should create a variable with different types', async () => {
      const numberVar = { ...mockParameter, type: VariableType.NUMBER };
      mockRepository.create.mockReturnValue(numberVar);
      mockRepository.save.mockResolvedValue(numberVar);

      const result = await service.create({
        ...createVariableDto,
        type: VariableType.NUMBER,
      });

      expect(result.type).toBe(VariableType.NUMBER);
    });

    it('should create a nullable variable', async () => {
      const nullableVar = { ...mockParameter, nullable: true };
      mockRepository.create.mockReturnValue(nullableVar);
      mockRepository.save.mockResolvedValue(nullableVar);

      const result = await service.create({
        ...createVariableDto,
        nullable: true,
      });

      expect(result.optional).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return an array of variables ordered by component and display order', async () => {
      mockRepository.find.mockResolvedValue([mockParameter, mockReturnValue]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['component'],
        order: { component_id: 'ASC', display_order: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no variables exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a variable by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockParameter);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['component'],
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe(mockParameter.name);
    });

    it('should throw NotFoundException when variable does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Variable with ID 999 not found',
      );
    });
  });

  describe('findByComponent', () => {
    it('should return variables for a specific component', async () => {
      mockRepository.find.mockResolvedValue([mockParameter, mockReturnValue]);

      const result = await service.findByComponent(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { component_id: 1 },
        relations: ['component'],
        order: { display_order: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].component_id).toBe(1);
    });

    it('should return empty array when component has no variables', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByComponent(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByKind', () => {
    it('should return all parameter variables', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findByKind(VariableKind.PARAMETER);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { kind: VariableKind.PARAMETER },
        relations: ['component'],
        order: { component_id: 'ASC', display_order: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(VariableKind.PARAMETER);
    });

    it('should return all return value variables', async () => {
      mockRepository.find.mockResolvedValue([mockReturnValue]);

      const result = await service.findByKind(VariableKind.RETURN_VALUE);

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe(VariableKind.RETURN_VALUE);
    });
  });

  describe('findByComponentAndKind', () => {
    it('should return variables filtered by component and kind', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findByComponentAndKind(
        1,
        VariableKind.PARAMETER,
      );

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { component_id: 1, kind: VariableKind.PARAMETER },
        relations: ['component'],
        order: { display_order: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].component_id).toBe(1);
      expect(result[0].kind).toBe(VariableKind.PARAMETER);
    });
  });

  describe('findInputs', () => {
    it('should return all input (parameter) variables', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findInputs();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { kind: VariableKind.PARAMETER },
        relations: ['component'],
        order: { component_id: 'ASC', display_order: 'ASC' },
      });
      expect(result[0].kind).toBe(VariableKind.PARAMETER);
    });
  });

  describe('findOutputs', () => {
    it('should return all output (return value) variables', async () => {
      mockRepository.find.mockResolvedValue([mockReturnValue]);

      const result = await service.findOutputs();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { kind: VariableKind.RETURN_VALUE },
        relations: ['component'],
        order: { component_id: 'ASC', display_order: 'ASC' },
      });
      expect(result[0].kind).toBe(VariableKind.RETURN_VALUE);
    });
  });

  describe('findParameters', () => {
    it('should return all parameter variables', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findParameters();

      expect(result[0].kind).toBe(VariableKind.PARAMETER);
    });
  });

  describe('findInputsByComponent', () => {
    it('should return input variables for a specific component', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findInputsByComponent(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { component_id: 1, kind: VariableKind.PARAMETER },
        relations: ['component'],
        order: { display_order: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOutputsByComponent', () => {
    it('should return output variables for a specific component', async () => {
      mockRepository.find.mockResolvedValue([mockReturnValue]);

      const result = await service.findOutputsByComponent(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { component_id: 1, kind: VariableKind.RETURN_VALUE },
        relations: ['component'],
        order: { display_order: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findParametersByComponent', () => {
    it('should return parameter variables for a specific component', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findParametersByComponent(1);

      expect(result[0].kind).toBe(VariableKind.PARAMETER);
      expect(result[0].component_id).toBe(1);
    });
  });

  describe('findByType', () => {
    it('should return variables of a specific type', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findByType(VariableType.STRING);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { type: VariableType.STRING },
        relations: ['component'],
        order: { component_id: 'ASC', display_order: 'ASC' },
      });
      expect(result[0].type).toBe(VariableType.STRING);
    });

    it('should handle different variable types', async () => {
      const numberVar = { ...mockParameter, type: VariableType.NUMBER };
      mockRepository.find.mockResolvedValue([numberVar]);

      const result = await service.findByType(VariableType.NUMBER);

      expect(result[0].type).toBe(VariableType.NUMBER);
    });
  });

  describe('findRequired', () => {
    it('should return only non-nullable (required) variables', async () => {
      mockRepository.find.mockResolvedValue([mockParameter]);

      const result = await service.findRequired();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { nullable: false },
        relations: ['component'],
        order: { component_id: 'ASC', display_order: 'ASC' },
      });
      expect(result[0].optional).toBe(false);
    });
  });

  describe('update', () => {
    const updateVariableDto: UpdateVariableDto = {
      name: 'updated_name',
      description: 'Updated description',
    };

    it('should update a variable', async () => {
      const updatedVariable = { ...mockParameter, ...updateVariableDto };

      mockRepository.findOne.mockResolvedValue(mockParameter);
      mockRepository.save.mockResolvedValue(updatedVariable);

      const result = await service.update(1, updateVariableDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['component'],
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateVariableDto.name);
      expect(result.description).toBe(updateVariableDto.description);
    });

    it('should throw NotFoundException when variable does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateVariableDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateVariableDto)).rejects.toThrow(
        'Variable with ID 999 not found',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should update validation regex', async () => {
      const updateDto: UpdateVariableDto = {
        validation_regex: '^[a-zA-Z]+$',
      };

      const updatedVariable = {
        ...mockParameter,
        validation_regex: '^[a-zA-Z]+$',
      };

      mockRepository.findOne.mockResolvedValue(mockParameter);
      mockRepository.save.mockResolvedValue(updatedVariable);

      const result = await service.update(1, updateDto);

      expect(result.validation_regex).toBe('^[a-zA-Z]+$');
    });

    it('should update display order', async () => {
      const updateDto: UpdateVariableDto = {
        display_order: 5,
      };

      const updatedVariable = { ...mockParameter, display_order: 5 };

      mockRepository.findOne.mockResolvedValue(mockParameter);
      mockRepository.save.mockResolvedValue(updatedVariable);

      const result = await service.update(1, updateDto);

      expect(result.display_order).toBe(5);
    });
  });

  describe('reorderVariables', () => {
    it('should reorder variables for a component', async () => {
      const var1 = { ...mockParameter, id: 1, display_order: 0 };
      const var2 = { ...mockParameter, id: 2, display_order: 1 };
      const var3 = { ...mockParameter, id: 3, display_order: 2 };

      mockRepository.find
        .mockResolvedValueOnce([var1, var2, var3]) // First call to get variables to reorder
        .mockResolvedValueOnce([
          { ...var3, display_order: 0 },
          { ...var1, display_order: 1 },
          { ...var2, display_order: 2 },
        ]); // Second call from findByComponent

      mockRepository.save.mockResolvedValue([]);

      const result = await service.reorderVariables(1, [3, 1, 2]);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should skip non-existent variable IDs', async () => {
      const var1 = { ...mockParameter, id: 1, display_order: 0 };
      const var2 = { ...mockParameter, id: 2, display_order: 1 };

      mockRepository.find
        .mockResolvedValueOnce([var1, var2])
        .mockResolvedValueOnce([var1, var2]);

      mockRepository.save.mockResolvedValue([]);

      const result = await service.reorderVariables(1, [1, 999, 2]);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should not save when no variables need updating', async () => {
      mockRepository.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.reorderVariables(1, [1, 2, 3]);

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should remove a variable', async () => {
      mockRepository.findOne.mockResolvedValue(mockParameter);
      mockRepository.remove.mockResolvedValue(mockParameter);

      await service.remove(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockParameter);
    });

    it('should throw NotFoundException when variable does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow(
        'Variable with ID 999 not found',
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('removeByComponent', () => {
    it('should remove all variables for a component', async () => {
      mockRepository.find.mockResolvedValue([mockParameter, mockReturnValue]);
      mockRepository.remove.mockResolvedValue([]);

      await service.removeByComponent(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { component_id: 1 },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith([
        mockParameter,
        mockReturnValue,
      ]);
    });

    it('should not call remove when no variables exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.removeByComponent(999);

      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('toResponseDto', () => {
    it('should correctly map nullable to optional', async () => {
      mockRepository.findOne.mockResolvedValue(mockParameter);

      const result = await service.findOne(1);

      expect(result.optional).toBe(mockParameter.nullable);
      expect(result).not.toHaveProperty('nullable');
    });

    it('should include all necessary fields in response', async () => {
      mockRepository.findOne.mockResolvedValue(mockParameter);

      const result = await service.findOne(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('component_id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('kind');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('optional');
      expect(result).toHaveProperty('placeholder');
      expect(result).toHaveProperty('validation_regex');
      expect(result).toHaveProperty('display_order');
    });

    it('should handle null values correctly', async () => {
      const variableWithNulls: Variable = {
        ...mockParameter,
        description: null,
        placeholder: null,
        validation_regex: null,
      };

      mockRepository.findOne.mockResolvedValue(variableWithNulls);

      const result = await service.findOne(1);

      expect(result.description).toBeNull();
      expect(result.placeholder).toBeNull();
      expect(result.validation_regex).toBeNull();
    });
  });
});
