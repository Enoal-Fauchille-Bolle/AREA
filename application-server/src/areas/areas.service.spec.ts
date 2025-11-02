/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AreasService } from './areas.service';
import { Area } from './entities/area.entity';
import { VariablesService } from '../variables/variables.service';
import { AreaParametersService } from '../area-parameters/area-parameters.service';
import { ComponentsService } from '../components/components.service';
import { NotFoundException } from '@nestjs/common';

describe('AreasService', () => {
  let service: AreasService;
  let mockRepository: any;
  let mockVariablesService: any;
  let mockAreaParametersService: any;
  let mockComponentsService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockVariablesService = {
      create: jest.fn(),
      findByComponent: jest.fn(),
    };

    mockAreaParametersService = {
      create: jest.fn(),
    };

    mockComponentsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasService,
        {
          provide: getRepositoryToken(Area),
          useValue: mockRepository,
        },
        {
          provide: VariablesService,
          useValue: mockVariablesService,
        },
        {
          provide: AreaParametersService,
          useValue: mockAreaParametersService,
        },
        {
          provide: ComponentsService,
          useValue: mockComponentsService,
        },
      ],
    }).compile();

    service = module.get<AreasService>(AreasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an area', async () => {
      const createDto = {
        component_action_id: 1,
        component_reaction_id: 2,
        name: 'Test Area',
        description: 'Test Description',
      };

      const mockArea = { id: 1, ...createDto };

      mockRepository.create.mockReturnValue(mockArea);
      mockRepository.save.mockResolvedValue(mockArea);

      const result = await service.create(1, createDto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should return all areas for a user', async () => {
      const areas = [
        { id: 1, user_id: 1, name: 'Area 1' },
        { id: 2, user_id: 1, name: 'Area 2' },
      ];

      mockRepository.find.mockResolvedValue(areas);

      const result = await service.findAll(1);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 1 },
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return an area by id', async () => {
      const area = { id: 1, user_id: 1, name: 'Test Area' };

      mockRepository.findOne.mockResolvedValue(area);

      const result = await service.findOne(1, 1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
      });
      expect(result).toEqual(area);
    });

    it('should throw NotFoundException when area not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an area', async () => {
      const area = { id: 1, user_id: 1, name: 'Old Name' };
      const updateDto = { name: 'New Name' };

      mockRepository.findOne.mockResolvedValue(area);
      mockRepository.save.mockResolvedValue({ ...area, ...updateDto });

      const result = await service.update(1, 1, updateDto);

      expect(result.name).toBe('New Name');
    });
  });

  describe('remove', () => {
    it('should remove an area', async () => {
      const area = { id: 1, user_id: 1, name: 'Test Area' };

      mockRepository.findOne.mockResolvedValue(area);
      mockRepository.remove.mockResolvedValue(area);

      await service.remove(1, 1);

      expect(mockRepository.remove).toHaveBeenCalledWith(area);
    });

    it('should throw NotFoundException when area not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('should toggle area active status', async () => {
      const area = { id: 1, user_id: 1, is_active: true };

      mockRepository.findOne.mockResolvedValue(area);
      mockRepository.save.mockResolvedValue({ ...area, is_active: false });

      const result = await service.toggleActive(1, 1);

      expect(result.is_active).toBe(false);
    });
  });

  describe('incrementTriggerCount', () => {
    it('should increment trigger count', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.incrementTriggerCount(1);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          last_triggered_at: expect.any(Date),
        }),
      );
    });
  });

  describe('findByActionComponent', () => {
    it('should find areas by action component name', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Area' }]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByActionComponent('daily_timer');

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('createWithParameters', () => {
    it('should create area with parameters', async () => {
      const createDto = {
        component_action_id: 1,
        component_reaction_id: 2,
        name: 'Test Area',
        description: 'Test',
      };
      const parameters = { time: '09:00' };

      const mockArea = { id: 1, ...createDto };

      mockRepository.create.mockReturnValue(mockArea);
      mockRepository.save.mockResolvedValue(mockArea);

      mockComponentsService.findOne
        .mockResolvedValueOnce({ id: 1, name: 'daily_timer' })
        .mockResolvedValueOnce({ id: 2, name: 'send_email' });

      mockVariablesService.findByComponent.mockResolvedValue([]);
      mockVariablesService.create.mockResolvedValue({ id: 1, name: 'time' });

      const result = await service.createWithParameters(1, createDto, parameters);

      expect(result.id).toBe(1);
      expect(mockComponentsService.findOne).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during creation', async () => {
      const createDto = {
        component_action_id: 1,
        component_reaction_id: 2,
        name: 'Test',
        description: 'Test',
      };

      mockRepository.create.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.createWithParameters(1, createDto, {}),
      ).rejects.toThrow();
    });
  });
});