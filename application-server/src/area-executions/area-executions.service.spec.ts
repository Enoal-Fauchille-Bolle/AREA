/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AreaExecutionsService } from './area-executions.service';
import {
  AreaExecution,
  ExecutionStatus,
} from './entities/area-execution.entity';
import { AreasService } from '../areas/areas.service';
import { NotFoundException } from '@nestjs/common';

describe('AreaExecutionsService', () => {
  let service: AreaExecutionsService;
  let mockRepository: any;
  let mockAreasService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockAreasService = {
      incrementTriggerCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaExecutionsService,
        {
          provide: getRepositoryToken(AreaExecution),
          useValue: mockRepository,
        },
        {
          provide: AreasService,
          useValue: mockAreasService,
        },
      ],
    }).compile();

    service = module.get<AreaExecutionsService>(AreaExecutionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new execution', async () => {
      const createDto = {
        areaId: 1,
        triggeredBy: 'timer',
        triggerData: {},
      };

      const mockExecution = {
        id: 1,
        areaId: 1,
        triggeredBy: 'timer',
        status: ExecutionStatus.PENDING,
        startedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockExecution);
      mockRepository.save.mockResolvedValue(mockExecution);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: ExecutionStatus.PENDING,
        startedAt: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockExecution);
      expect(mockAreasService.incrementTriggerCount).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('should use provided status and startedAt', async () => {
      const startedAt = new Date('2024-01-01');
      const createDto = {
        areaId: 1,
        triggeredBy: 'manual',
        triggerData: {},
        status: ExecutionStatus.RUNNING,
        startedAt,
      };

      mockRepository.create.mockReturnValue({ ...createDto, id: 1 });
      mockRepository.save.mockResolvedValue({ ...createDto, id: 1 });

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: ExecutionStatus.RUNNING,
        startedAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return all executions', async () => {
      const executions = [
        { id: 1, areaId: 1, status: ExecutionStatus.SUCCESS },
        { id: 2, areaId: 2, status: ExecutionStatus.PENDING },
      ];

      mockRepository.find.mockResolvedValue(executions);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return an execution by id', async () => {
      const execution = {
        id: 1,
        areaId: 1,
        status: ExecutionStatus.SUCCESS,
      };

      mockRepository.findOne.mockResolvedValue(execution);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when execution not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByAreaId', () => {
    it('should return executions for a specific area', async () => {
      const executions = [
        { id: 1, areaId: 5, status: ExecutionStatus.SUCCESS },
        { id: 2, areaId: 5, status: ExecutionStatus.FAILED },
      ];

      mockRepository.find.mockResolvedValue(executions);

      const result = await service.findByAreaId(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { areaId: 5 },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findByStatus', () => {
    it('should return executions with a specific status', async () => {
      const executions = [
        { id: 1, status: ExecutionStatus.PENDING },
        { id: 2, status: ExecutionStatus.PENDING },
      ];

      mockRepository.find.mockResolvedValue(executions);

      const result = await service.findByStatus(ExecutionStatus.PENDING);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: ExecutionStatus.PENDING },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findRecentExecutions', () => {
    it('should return recent executions with default limit', async () => {
      const executions = Array(50).fill({
        id: 1,
        status: ExecutionStatus.SUCCESS,
      });

      mockRepository.find.mockResolvedValue(executions);

      const result = await service.findRecentExecutions();

      expect(mockRepository.find).toHaveBeenCalledWith({ take: 50 });
      expect(result).toHaveLength(50);
    });

    it('should return recent executions with custom limit', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findRecentExecutions(10);

      expect(mockRepository.find).toHaveBeenCalledWith({ take: 10 });
    });
  });

  describe('findLongRunningExecutions', () => {
    it('should find long running executions with default threshold', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findLongRunningExecutions();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'execution.status = :status',
        { status: ExecutionStatus.RUNNING },
      );
    });

    it('should find long running executions with custom threshold', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findLongRunningExecutions(60);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'execution.started_at < :threshold',
        expect.objectContaining({ threshold: expect.any(Date) }),
      );
    });
  });

  describe('findFailedExecutions', () => {
    it('should find all failed executions', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findFailedExecutions();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: ExecutionStatus.FAILED },
      });
    });

    it('should find failed executions for a specific area', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findFailedExecutions(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: ExecutionStatus.FAILED, areaId: 5 },
      });
    });
  });

  describe('update', () => {
    it('should update an execution', async () => {
      const execution = {
        id: 1,
        status: ExecutionStatus.RUNNING,
      };

      mockRepository.findOne.mockResolvedValue(execution);
      mockRepository.save.mockResolvedValue({
        ...execution,
        status: ExecutionStatus.SUCCESS,
      });

      const result = await service.update(1, {
        status: ExecutionStatus.SUCCESS,
      });

      expect(result.status).toBe(ExecutionStatus.SUCCESS);
    });

    it('should throw NotFoundException when execution not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { status: ExecutionStatus.SUCCESS }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should auto-calculate execution time on success', async () => {
      const startedAt = new Date('2024-01-01T12:00:00Z');
      const completedAt = new Date('2024-01-01T12:01:30Z');
      const execution = {
        id: 1,
        status: ExecutionStatus.RUNNING,
        startedAt,
      };

      mockRepository.findOne.mockResolvedValue(execution);
      mockRepository.save.mockResolvedValue(execution);

      await service.update(1, {
        status: ExecutionStatus.SUCCESS,
        completedAt,
      });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          executionTimeMs: 90000,
          completedAt,
        }),
      );
    });
  });

  describe('startExecution', () => {
    it('should set execution to RUNNING status', async () => {
      const execution = { id: 1, status: ExecutionStatus.PENDING };

      mockRepository.findOne.mockResolvedValue(execution);
      mockRepository.save.mockResolvedValue({
        ...execution,
        status: ExecutionStatus.RUNNING,
      });

      const result = await service.startExecution(1);

      expect(result.status).toBe(ExecutionStatus.RUNNING);
    });
  });

  describe('completeExecution', () => {
    it('should complete execution successfully', async () => {
      const execution = { id: 1, status: ExecutionStatus.RUNNING };

      mockRepository.findOne.mockResolvedValue(execution);
      mockRepository.save.mockResolvedValue({
        ...execution,
        status: ExecutionStatus.SUCCESS,
      });

      const result = await service.completeExecution(1, { data: 'result' });

      expect(result.status).toBe(ExecutionStatus.SUCCESS);
    });
  });

  describe('failExecution', () => {
    it('should mark execution as failed with error message', async () => {
      const execution = { id: 1, status: ExecutionStatus.RUNNING };

      mockRepository.findOne.mockResolvedValue(execution);
      mockRepository.save.mockResolvedValue({
        ...execution,
        status: ExecutionStatus.FAILED,
        errorMessage: 'Test error',
      });

      const result = await service.failExecution(1, 'Test error');

      expect(result.status).toBe(ExecutionStatus.FAILED);
    });
  });

  describe('cancelExecution', () => {
    it('should cancel an execution', async () => {
      const execution = { id: 1, status: ExecutionStatus.RUNNING };

      mockRepository.findOne.mockResolvedValue(execution);
      mockRepository.save.mockResolvedValue({
        ...execution,
        status: ExecutionStatus.CANCELLED,
      });

      const result = await service.cancelExecution(1);

      expect(result.status).toBe(ExecutionStatus.CANCELLED);
    });
  });

  describe('remove', () => {
    it('should remove an execution', async () => {
      const execution = { id: 1 };

      mockRepository.findOne.mockResolvedValue(execution);
      mockRepository.remove.mockResolvedValue(execution);

      await service.remove(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(execution);
    });

    it('should throw NotFoundException when execution not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeByAreaId', () => {
    it('should remove all executions for an area', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 3 });

      await service.removeByAreaId(5);

      expect(mockRepository.delete).toHaveBeenCalledWith({ areaId: 5 });
    });
  });

  describe('cleanup', () => {
    it('should cleanup old completed executions', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 10 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanup(30);

      expect(result).toBe(10);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should use custom days for cleanup', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanup(60);

      expect(result).toBe(5);
    });

    it('should return 0 when no records affected', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: undefined }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanup(30);

      expect(result).toBe(0);
    });
  });

  describe('getExecutionStats', () => {
    it('should return execution statistics', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '1500' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getExecutionStats();

      expect(result).toEqual({
        total: 10,
        pending: 10,
        running: 10,
        completed: 10,
        failed: 10,
        cancelled: 10,
        avgExecutionTimeMs: 1500,
      });
    });

    it('should return null for avgExecutionTimeMs when no data', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: null }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getExecutionStats();

      expect(result.avgExecutionTimeMs).toBeNull();
    });

    it('should filter stats by area id', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '2000' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getExecutionStats(5);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'execution.area_id = :areaId',
        { areaId: 5 },
      );
      expect(result.total).toBe(5);
    });
  });
});
