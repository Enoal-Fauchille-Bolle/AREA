import { Test, TestingModule } from '@nestjs/testing';
import { AreaParametersController } from './area-parameters.controller';
import { AreaParametersService } from './area-parameters.service';
import {
  CreateAreaParameterDto,
  UpdateAreaParameterDto,
  AreaParameterResponseDto,
} from './dto';

describe('AreaParametersController', () => {
  let controller: AreaParametersController;
  let _service: AreaParametersService;

  const mockAreaParameter: AreaParameterResponseDto = {
    area_id: 1,
    variable_id: 1,
    value: 'test value',
    variable: {
      id: 1,
      component_id: 1,
      name: 'test_param',
      description: 'Test parameter',
      kind: 'parameter',
      type: 'string',
      nullable: false,
      placeholder: null,
      validation_regex: null,
      display_order: 0,
    },
  };

  const mockAreaParametersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateValue: jest.fn(),
    remove: jest.fn(),
    findByArea: jest.fn(),
    findByVariable: jest.fn(),
    findTemplates: jest.fn(),
    findTemplatesByArea: jest.fn(),
    bulkCreateOrUpdate: jest.fn(),
    removeByArea: jest.fn(),
    removeByVariable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaParametersController],
      providers: [
        {
          provide: AreaParametersService,
          useValue: mockAreaParametersService,
        },
      ],
    }).compile();

    controller = module.get<AreaParametersController>(AreaParametersController);
    _service = module.get<AreaParametersService>(AreaParametersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an area parameter', async () => {
      const createDto: CreateAreaParameterDto = {
        area_id: 1,
        variable_id: 1,
        value: 'test value',
        is_template: false,
      };

      mockAreaParametersService.create.mockResolvedValue(mockAreaParameter);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockAreaParameter);
      expect(mockAreaParametersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all area parameters without filters', async () => {
      mockAreaParametersService.findAll.mockResolvedValue([mockAreaParameter]);

      const result = await controller.findAll();

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findAll).toHaveBeenCalled();
    });

    it('should filter by area_id', async () => {
      mockAreaParametersService.findByArea.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findAll('1');

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findByArea).toHaveBeenCalledWith(1);
    });

    it('should filter by variable_id', async () => {
      mockAreaParametersService.findByVariable.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findAll(undefined, '1');

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findByVariable).toHaveBeenCalledWith(1);
    });

    it('should filter templates when templates=true', async () => {
      mockAreaParametersService.findTemplates.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findAll(undefined, undefined, 'true');

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findTemplates).toHaveBeenCalled();
    });

    it('should filter templates by area when both area_id and templates=true', async () => {
      mockAreaParametersService.findTemplatesByArea.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findAll('1', undefined, 'true');

      expect(result).toEqual([mockAreaParameter]);
      expect(
        mockAreaParametersService.findTemplatesByArea,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('findTemplates', () => {
    it('should return all template parameters', async () => {
      mockAreaParametersService.findTemplates.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findTemplates();

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findTemplates).toHaveBeenCalled();
    });
  });

  describe('findByArea', () => {
    it('should return parameters for an area', async () => {
      mockAreaParametersService.findByArea.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findByArea(1);

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findByArea).toHaveBeenCalledWith(1);
    });
  });

  describe('findTemplatesByArea', () => {
    it('should return template parameters for an area', async () => {
      mockAreaParametersService.findTemplatesByArea.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findTemplatesByArea(1);

      expect(result).toEqual([mockAreaParameter]);
      expect(
        mockAreaParametersService.findTemplatesByArea,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('findByVariable', () => {
    it('should return parameters for a variable', async () => {
      mockAreaParametersService.findByVariable.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findByVariable(1);

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findByVariable).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a parameter by area and variable id', async () => {
      mockAreaParametersService.findOne.mockResolvedValue(mockAreaParameter);

      const result = await controller.findOne(1, 1);

      expect(result).toEqual(mockAreaParameter);
      expect(mockAreaParametersService.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('update', () => {
    it('should update an area parameter', async () => {
      const updateDto: UpdateAreaParameterDto = {
        value: 'updated value',
      };

      const updatedParameter = {
        ...mockAreaParameter,
        value: 'updated value',
      };

      mockAreaParametersService.update.mockResolvedValue(updatedParameter);

      const result = await controller.update(1, 1, updateDto);

      expect(result).toEqual(updatedParameter);
      expect(mockAreaParametersService.update).toHaveBeenCalledWith(
        1,
        1,
        updateDto,
      );
    });
  });

  describe('updateValue', () => {
    it('should update parameter value directly', async () => {
      const updatedParameter = {
        ...mockAreaParameter,
        value: 'new value',
      };

      mockAreaParametersService.updateValue.mockResolvedValue(updatedParameter);

      const result = await controller.updateValue(1, 1, { value: 'new value' });

      expect(result).toEqual(updatedParameter);
      expect(mockAreaParametersService.updateValue).toHaveBeenCalledWith(
        1,
        1,
        'new value',
      );
    });
  });

  describe('bulkCreateOrUpdate', () => {
    it('should bulk create or update parameters', async () => {
      const bulkParams = [
        { variable_id: 1, value: 'value1', is_template: false },
        { variable_id: 2, value: 'value2', is_template: true },
      ];

      const resultParams = [
        { ...mockAreaParameter, variable_id: 1, value: 'value1' },
        { ...mockAreaParameter, variable_id: 2, value: 'value2' },
      ];

      mockAreaParametersService.bulkCreateOrUpdate.mockResolvedValue(
        resultParams,
      );

      const result = await controller.bulkCreateOrUpdate(1, {
        parameters: bulkParams,
      });

      expect(result).toEqual(resultParams);
      expect(mockAreaParametersService.bulkCreateOrUpdate).toHaveBeenCalledWith(
        1,
        bulkParams,
      );
    });

    it('should handle empty bulk update', async () => {
      mockAreaParametersService.bulkCreateOrUpdate.mockResolvedValue([]);

      const result = await controller.bulkCreateOrUpdate(1, {
        parameters: [],
      });

      expect(result).toEqual([]);
      expect(mockAreaParametersService.bulkCreateOrUpdate).toHaveBeenCalledWith(
        1,
        [],
      );
    });
  });

  describe('remove', () => {
    it('should remove a parameter by area and variable id', async () => {
      mockAreaParametersService.remove.mockResolvedValue(undefined);

      await controller.remove(1, 1);

      expect(mockAreaParametersService.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('removeByArea', () => {
    it('should remove all parameters for an area', async () => {
      mockAreaParametersService.removeByArea.mockResolvedValue(undefined);

      await controller.removeByArea(1);

      expect(mockAreaParametersService.removeByArea).toHaveBeenCalledWith(1);
    });
  });

  describe('removeByVariable', () => {
    it('should remove all parameters for a variable', async () => {
      mockAreaParametersService.removeByVariable.mockResolvedValue(undefined);

      await controller.removeByVariable(1);

      expect(mockAreaParametersService.removeByVariable).toHaveBeenCalledWith(
        1,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle invalid area_id in query', async () => {
      mockAreaParametersService.findByArea.mockResolvedValue([]);

      await controller.findAll('invalid');

      // parseInt('invalid') returns NaN
      expect(mockAreaParametersService.findByArea).toHaveBeenCalledWith(NaN);
    });

    it('should prioritize templates filter over area filter', async () => {
      mockAreaParametersService.findTemplatesByArea.mockResolvedValue([
        mockAreaParameter,
      ]);

      const result = await controller.findAll('1', undefined, 'true');

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findTemplatesByArea).toHaveBeenCalled();
      expect(mockAreaParametersService.findByArea).not.toHaveBeenCalled();
    });

    it('should handle templates filter when not true', async () => {
      mockAreaParametersService.findAll.mockResolvedValue([mockAreaParameter]);

      const result = await controller.findAll(undefined, undefined, 'false');

      expect(result).toEqual([mockAreaParameter]);
      expect(mockAreaParametersService.findAll).toHaveBeenCalled();
      expect(mockAreaParametersService.findTemplates).not.toHaveBeenCalled();
    });
  });
});
