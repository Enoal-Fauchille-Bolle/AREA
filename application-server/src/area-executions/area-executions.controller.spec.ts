import { Test, TestingModule } from '@nestjs/testing';
import { AreaExecutionsController } from './area-executions.controller';
import { AreaExecutionsService } from './area-executions.service';
import {
  CreateAreaExecutionDto,
  UpdateAreaExecutionDto,
  AreaExecutionResponseDto,
} from './dto';
import { ExecutionStatus } from './entities/area-execution.entity';

describe('AreaExecutionsController', () => {
  let controller: AreaExecutionsController;
  let _service: AreaExecutionsService;

  const mockExecution: AreaExecutionResponseDto = {
    id: 1,
    areaId: 1,
    status: ExecutionStatus.PENDING,
    triggerData: { test: 'data' },
    executionResult: null,
    errorMessage: null,
    startedAt: null,
    completedAt: null,
    executionTimeMs: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockStats = {
    total: 100,
    pending: 10,
    running: 5,
    completed: 80,
    failed: 4,
    cancelled: 1,
    avgExecutionTimeMs: 1500,
  };

  const mockAreaExecutionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByAreaId: jest.fn(),
    findByStatus: jest.fn(),
    findRecentExecutions: jest.fn(),
    findLongRunningExecutions: jest.fn(),
    findFailedExecutions: jest.fn(),
    getExecutionStats: jest.fn(),
    startExecution: jest.fn(),
    completeExecution: jest.fn(),
    failExecution: jest.fn(),
    cancelExecution: jest.fn(),
    removeByAreaId: jest.fn(),
    cleanup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaExecutionsController],
      providers: [
        {
          provide: AreaExecutionsService,
          useValue: mockAreaExecutionsService,
        },
      ],
    }).compile();

    controller = module.get<AreaExecutionsController>(AreaExecutionsController);
    _service = module.get<AreaExecutionsService>(AreaExecutionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an area execution', async () => {
      const createDto: CreateAreaExecutionDto = {
        areaId: 1,
        status: ExecutionStatus.PENDING,
        triggerData: { test: 'data' },
      };

      mockAreaExecutionsService.create.mockResolvedValue(mockExecution);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockExecution);
      expect(mockAreaExecutionsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all executions', async () => {
      mockAreaExecutionsService.findAll.mockResolvedValue([mockExecution]);

      const result = await controller.findAll();

      expect(result).toEqual([mockExecution]);
      expect(mockAreaExecutionsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findRecent', () => {
    it('should return recent executions with default limit', async () => {
      mockAreaExecutionsService.findRecentExecutions.mockResolvedValue([
        mockExecution,
      ]);

      const result = await controller.findRecent(50);

      expect(result).toEqual([mockExecution]);
      expect(
        mockAreaExecutionsService.findRecentExecutions,
      ).toHaveBeenCalledWith(50);
    });

    it('should return recent executions with custom limit', async () => {
      mockAreaExecutionsService.findRecentExecutions.mockResolvedValue([
        mockExecution,
      ]);

      const result = await controller.findRecent(100);

      expect(result).toEqual([mockExecution]);
      expect(
        mockAreaExecutionsService.findRecentExecutions,
      ).toHaveBeenCalledWith(100);
    });
  });

  describe('findByStatus', () => {
    it('should return executions by status', async () => {
      mockAreaExecutionsService.findByStatus.mockResolvedValue([mockExecution]);

      const result = await controller.findByStatus(ExecutionStatus.PENDING);

      expect(result).toEqual([mockExecution]);
      expect(mockAreaExecutionsService.findByStatus).toHaveBeenCalledWith(
        ExecutionStatus.PENDING,
      );
    });

    it('should handle failed status', async () => {
      const failedExecution = {
        ...mockExecution,
        status: ExecutionStatus.FAILED,
      };
      mockAreaExecutionsService.findByStatus.mockResolvedValue([
        failedExecution,
      ]);

      const result = await controller.findByStatus(ExecutionStatus.FAILED);

      expect(result).toEqual([failedExecution]);
      expect(mockAreaExecutionsService.findByStatus).toHaveBeenCalledWith(
        ExecutionStatus.FAILED,
      );
    });
  });

  describe('findLongRunning', () => {
    it('should return long running executions with default threshold', async () => {
      mockAreaExecutionsService.findLongRunningExecutions.mockResolvedValue([
        mockExecution,
      ]);

      const result = await controller.findLongRunning(30);

      expect(result).toEqual([mockExecution]);
      expect(
        mockAreaExecutionsService.findLongRunningExecutions,
      ).toHaveBeenCalledWith(30);
    });

    it('should return long running executions with custom threshold', async () => {
      mockAreaExecutionsService.findLongRunningExecutions.mockResolvedValue([
        mockExecution,
      ]);

      const result = await controller.findLongRunning(60);

      expect(result).toEqual([mockExecution]);
      expect(
        mockAreaExecutionsService.findLongRunningExecutions,
      ).toHaveBeenCalledWith(60);
    });
  });

  describe('findFailed', () => {
    it('should return all failed executions without area filter', async () => {
      mockAreaExecutionsService.findFailedExecutions.mockResolvedValue([
        mockExecution,
      ]);

      const result = await controller.findFailed(undefined);

      expect(result).toEqual([mockExecution]);
      expect(
        mockAreaExecutionsService.findFailedExecutions,
      ).toHaveBeenCalledWith(undefined);
    });

    it('should return failed executions for specific area', async () => {
      mockAreaExecutionsService.findFailedExecutions.mockResolvedValue([
        mockExecution,
      ]);

      const result = await controller.findFailed(1);

      expect(result).toEqual([mockExecution]);
      expect(
        mockAreaExecutionsService.findFailedExecutions,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('findByAreaId', () => {
    it('should return executions for an area', async () => {
      mockAreaExecutionsService.findByAreaId.mockResolvedValue([mockExecution]);

      const result = await controller.findByAreaId(1);

      expect(result).toEqual([mockExecution]);
      expect(mockAreaExecutionsService.findByAreaId).toHaveBeenCalledWith(1);
    });
  });

  describe('getAreaStats', () => {
    it('should return statistics for an area', async () => {
      mockAreaExecutionsService.getExecutionStats.mockResolvedValue(mockStats);

      const result = await controller.getAreaStats(1);

      expect(result).toEqual(mockStats);
      expect(mockAreaExecutionsService.getExecutionStats).toHaveBeenCalledWith(
        1,
      );
    });
  });

  describe('getGlobalStats', () => {
    it('should return global statistics', async () => {
      mockAreaExecutionsService.getExecutionStats.mockResolvedValue(mockStats);

      const result = await controller.getGlobalStats();

      expect(result).toEqual(mockStats);
      expect(
        mockAreaExecutionsService.getExecutionStats,
      ).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return an execution by id', async () => {
      mockAreaExecutionsService.findOne.mockResolvedValue(mockExecution);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockExecution);
      expect(mockAreaExecutionsService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update an execution', async () => {
      const updateDto: UpdateAreaExecutionDto = {
        status: ExecutionStatus.RUNNING,
      };

      const updatedExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
      };

      mockAreaExecutionsService.update.mockResolvedValue(updatedExecution);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedExecution);
      expect(mockAreaExecutionsService.update).toHaveBeenCalledWith(
        1,
        updateDto,
      );
    });
  });

  describe('startExecution', () => {
    it('should start an execution', async () => {
      const runningExecution = {
        ...mockExecution,
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
      };

      mockAreaExecutionsService.startExecution.mockResolvedValue(
        runningExecution,
      );

      const result = await controller.startExecution(1);

      expect(result).toEqual(runningExecution);
      expect(mockAreaExecutionsService.startExecution).toHaveBeenCalledWith(1);
    });
  });

  describe('completeExecution', () => {
    it('should complete an execution without result', async () => {
      const completedExecution = {
        ...mockExecution,
        status: ExecutionStatus.SUCCESS,
        completedAt: new Date(),
      };

      mockAreaExecutionsService.completeExecution.mockResolvedValue(
        completedExecution,
      );

      const result = await controller.completeExecution(1, {});

      expect(result).toEqual(completedExecution);
      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        1,
        undefined,
      );
    });

    it('should complete an execution with result', async () => {
      const executionResult = { success: true, data: 'result' };
      const completedExecution = {
        ...mockExecution,
        status: ExecutionStatus.SUCCESS,
        executionResult,
        completedAt: new Date(),
      };

      mockAreaExecutionsService.completeExecution.mockResolvedValue(
        completedExecution,
      );

      const result = await controller.completeExecution(1, { executionResult });

      expect(result).toEqual(completedExecution);
      expect(mockAreaExecutionsService.completeExecution).toHaveBeenCalledWith(
        1,
        executionResult,
      );
    });
  });

  describe('failExecution', () => {
    it('should fail an execution with error message', async () => {
      const failedExecution = {
        ...mockExecution,
        status: ExecutionStatus.FAILED,
        errorMessage: 'Test error',
        completedAt: new Date(),
      };

      mockAreaExecutionsService.failExecution.mockResolvedValue(
        failedExecution,
      );

      const result = await controller.failExecution(1, {
        errorMessage: 'Test error',
      });

      expect(result).toEqual(failedExecution);
      expect(mockAreaExecutionsService.failExecution).toHaveBeenCalledWith(
        1,
        'Test error',
      );
    });
  });

  describe('cancelExecution', () => {
    it('should cancel an execution', async () => {
      const cancelledExecution = {
        ...mockExecution,
        status: ExecutionStatus.CANCELLED,
        completedAt: new Date(),
      };

      mockAreaExecutionsService.cancelExecution.mockResolvedValue(
        cancelledExecution,
      );

      const result = await controller.cancelExecution(1);

      expect(result).toEqual(cancelledExecution);
      expect(mockAreaExecutionsService.cancelExecution).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('should remove an execution', async () => {
      mockAreaExecutionsService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(mockAreaExecutionsService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('removeByAreaId', () => {
    it('should remove all executions for an area', async () => {
      mockAreaExecutionsService.removeByAreaId.mockResolvedValue(undefined);

      await controller.removeByAreaId(1);

      expect(mockAreaExecutionsService.removeByAreaId).toHaveBeenCalledWith(1);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old executions with default days', async () => {
      mockAreaExecutionsService.cleanup.mockResolvedValue(42);

      const result = await controller.cleanup(30);

      expect(result).toEqual({ deleted: 42 });
      expect(mockAreaExecutionsService.cleanup).toHaveBeenCalledWith(30);
    });

    it('should cleanup old executions with custom days', async () => {
      mockAreaExecutionsService.cleanup.mockResolvedValue(15);

      const result = await controller.cleanup(90);

      expect(result).toEqual({ deleted: 15 });
      expect(mockAreaExecutionsService.cleanup).toHaveBeenCalledWith(90);
    });

    it('should handle cleanup with zero results', async () => {
      mockAreaExecutionsService.cleanup.mockResolvedValue(0);

      const result = await controller.cleanup(60);

      expect(result).toEqual({ deleted: 0 });
      expect(mockAreaExecutionsService.cleanup).toHaveBeenCalledWith(60);
    });
  });
});
