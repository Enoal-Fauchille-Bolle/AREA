import { Test, TestingModule } from '@nestjs/testing';
import { VariablesController } from './variables.controller';
import { VariablesService } from './variables.service';
import {
  CreateVariableDto,
  UpdateVariableDto,
  VariableResponseDto,
} from './dto';
import { VariableKind, VariableType } from './entities/variable.entity';

describe('VariablesController', () => {
  let controller: VariablesController;
  let _service: VariablesService;

  const mockVariable: VariableResponseDto = {
    id: 1,
    name: 'test_variable',
    description: 'Test variable',
    component_id: 1,
    kind: VariableKind.PARAMETER,
    type: VariableType.STRING,
    optional: false,
    placeholder: null,
    validation_regex: null,
    display_order: 0,
  };

  const mockVariablesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByComponent: jest.fn(),
    findByComponentAndKind: jest.fn(),
    findByType: jest.fn(),
    findInputs: jest.fn(),
    findOutputs: jest.fn(),
    findParameters: jest.fn(),
    findRequired: jest.fn(),
    findInputsByComponent: jest.fn(),
    findOutputsByComponent: jest.fn(),
    findParametersByComponent: jest.fn(),
    reorderVariables: jest.fn(),
    removeByComponent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariablesController],
      providers: [
        {
          provide: VariablesService,
          useValue: mockVariablesService,
        },
      ],
    }).compile();

    controller = module.get<VariablesController>(VariablesController);
    _service = module.get<VariablesService>(VariablesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a variable', async () => {
      const createDto: CreateVariableDto = {
        name: 'test_variable',
        description: 'Test variable',
        component_id: 1,
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: undefined,
        validation_regex: undefined,
        display_order: 0,
      };

      mockVariablesService.create.mockResolvedValue(mockVariable);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockVariable);
      expect(mockVariablesService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all variables without filters', async () => {
      mockVariablesService.findAll.mockResolvedValue([mockVariable]);

      const result = await controller.findAll();

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findAll).toHaveBeenCalled();
    });

    it('should filter by required when required=true', async () => {
      mockVariablesService.findRequired.mockResolvedValue([mockVariable]);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        'true',
      );

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findRequired).toHaveBeenCalled();
      expect(mockVariablesService.findAll).not.toHaveBeenCalled();
    });

    it('should filter by component and kind', async () => {
      mockVariablesService.findByComponentAndKind.mockResolvedValue([
        mockVariable,
      ]);

      const result = await controller.findAll('parameter', '1');

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findByComponentAndKind).toHaveBeenCalledWith(
        1,
        VariableKind.PARAMETER,
      );
    });

    it('should filter inputs when kind=input', async () => {
      mockVariablesService.findInputs.mockResolvedValue([mockVariable]);

      const result = await controller.findAll('input');

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findInputs).toHaveBeenCalled();
    });

    it('should filter outputs when kind=output', async () => {
      mockVariablesService.findOutputs.mockResolvedValue([mockVariable]);

      const result = await controller.findAll('output');

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findOutputs).toHaveBeenCalled();
    });

    it('should filter parameters when kind=parameter', async () => {
      mockVariablesService.findParameters.mockResolvedValue([mockVariable]);

      const result = await controller.findAll('parameter');

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findParameters).toHaveBeenCalled();
    });

    it('should filter by component ID', async () => {
      mockVariablesService.findByComponent.mockResolvedValue([mockVariable]);

      const result = await controller.findAll(undefined, '1');

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findByComponent).toHaveBeenCalledWith(1);
    });

    it('should filter by type', async () => {
      mockVariablesService.findByType.mockResolvedValue([mockVariable]);

      const result = await controller.findAll(
        undefined,
        undefined,
        VariableType.STRING,
      );

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findByType).toHaveBeenCalledWith(
        VariableType.STRING,
      );
    });
  });

  describe('specialized find endpoints', () => {
    it('should find inputs', async () => {
      mockVariablesService.findInputs.mockResolvedValue([mockVariable]);

      const result = await controller.findInputs();

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findInputs).toHaveBeenCalled();
    });

    it('should find outputs', async () => {
      mockVariablesService.findOutputs.mockResolvedValue([mockVariable]);

      const result = await controller.findOutputs();

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findOutputs).toHaveBeenCalled();
    });

    it('should find parameters', async () => {
      mockVariablesService.findParameters.mockResolvedValue([mockVariable]);

      const result = await controller.findParameters();

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findParameters).toHaveBeenCalled();
    });

    it('should find required variables', async () => {
      mockVariablesService.findRequired.mockResolvedValue([mockVariable]);

      const result = await controller.findRequired();

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findRequired).toHaveBeenCalled();
    });
  });

  describe('findByComponent', () => {
    it('should return variables for a component', async () => {
      mockVariablesService.findByComponent.mockResolvedValue([mockVariable]);

      const result = await controller.findByComponent(1);

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findByComponent).toHaveBeenCalledWith(1);
    });
  });

  describe('findInputsByComponent', () => {
    it('should return inputs for a component', async () => {
      const returnValueVariable = {
        ...mockVariable,
        kind: VariableKind.RETURN_VALUE,
      };
      mockVariablesService.findInputsByComponent.mockResolvedValue([
        returnValueVariable,
      ]);

      const result = await controller.findInputsByComponent(1);

      expect(result).toEqual([returnValueVariable]);
      expect(mockVariablesService.findInputsByComponent).toHaveBeenCalledWith(
        1,
      );
    });
  });

  describe('findOutputsByComponent', () => {
    it('should return outputs for a component', async () => {
      const returnValueVariable = {
        ...mockVariable,
        kind: VariableKind.RETURN_VALUE,
      };
      mockVariablesService.findOutputsByComponent.mockResolvedValue([
        returnValueVariable,
      ]);

      const result = await controller.findOutputsByComponent(1);

      expect(result).toEqual([returnValueVariable]);
      expect(mockVariablesService.findOutputsByComponent).toHaveBeenCalledWith(
        1,
      );
    });
  });

  describe('findParametersByComponent', () => {
    it('should return parameters for a component', async () => {
      mockVariablesService.findParametersByComponent.mockResolvedValue([
        mockVariable,
      ]);

      const result = await controller.findParametersByComponent(1);

      expect(result).toEqual([mockVariable]);
      expect(
        mockVariablesService.findParametersByComponent,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('findByType', () => {
    it('should return variables by type', async () => {
      mockVariablesService.findByType.mockResolvedValue([mockVariable]);

      const result = await controller.findByType(VariableType.STRING);

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findByType).toHaveBeenCalledWith(
        VariableType.STRING,
      );
    });
  });

  describe('findOne', () => {
    it('should return a variable by id', async () => {
      mockVariablesService.findOne.mockResolvedValue(mockVariable);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockVariable);
      expect(mockVariablesService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a variable', async () => {
      const updateDto: UpdateVariableDto = {
        name: 'updated_variable',
        description: 'Updated description',
      };

      const updatedVariable = {
        ...mockVariable,
        ...updateDto,
      };

      mockVariablesService.update.mockResolvedValue(updatedVariable);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedVariable);
      expect(mockVariablesService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('reorderVariables', () => {
    it('should reorder variables for a component', async () => {
      const variableIds = [3, 1, 2];
      const reorderedVariables = [
        { ...mockVariable, id: 3, display_order: 0 },
        { ...mockVariable, id: 1, display_order: 1 },
        { ...mockVariable, id: 2, display_order: 2 },
      ];

      mockVariablesService.reorderVariables.mockResolvedValue(
        reorderedVariables,
      );

      const result = await controller.reorderVariables(1, { variableIds });

      expect(result).toEqual(reorderedVariables);
      expect(mockVariablesService.reorderVariables).toHaveBeenCalledWith(
        1,
        variableIds,
      );
    });

    it('should handle empty reorder array', async () => {
      mockVariablesService.reorderVariables.mockResolvedValue([]);

      const result = await controller.reorderVariables(1, { variableIds: [] });

      expect(result).toEqual([]);
      expect(mockVariablesService.reorderVariables).toHaveBeenCalledWith(1, []);
    });
  });

  describe('remove', () => {
    it('should remove a variable', async () => {
      mockVariablesService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockVariablesService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('removeByComponent', () => {
    it('should remove all variables for a component', async () => {
      mockVariablesService.removeByComponent.mockResolvedValue(undefined);

      await controller.removeByComponent(1);

      expect(mockVariablesService.removeByComponent).toHaveBeenCalledWith(1);
    });
  });

  describe('edge cases', () => {
    it('should handle non-numeric component ID in query params', async () => {
      mockVariablesService.findByComponent.mockResolvedValue([]);

      // NaN should be handled by the controller
      await controller.findAll(undefined, 'invalid');

      // parseInt('invalid') returns NaN
      expect(mockVariablesService.findByComponent).toHaveBeenCalledWith(NaN);
    });

    it('should handle multiple filter priorities correctly', async () => {
      // required filter takes precedence
      mockVariablesService.findRequired.mockResolvedValue([mockVariable]);

      const result = await controller.findAll('input', '1', 'string', 'true');

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findRequired).toHaveBeenCalled();
      expect(mockVariablesService.findInputs).not.toHaveBeenCalled();
      expect(mockVariablesService.findByComponent).not.toHaveBeenCalled();
    });

    it('should handle kind and componentId priority over type', async () => {
      mockVariablesService.findByComponentAndKind.mockResolvedValue([
        mockVariable,
      ]);

      const result = await controller.findAll('parameter', '1', 'string');

      expect(result).toEqual([mockVariable]);
      expect(mockVariablesService.findByComponentAndKind).toHaveBeenCalled();
      expect(mockVariablesService.findByType).not.toHaveBeenCalled();
    });
  });
});
