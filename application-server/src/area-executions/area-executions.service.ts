import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  AreaExecution,
  ExecutionStatus,
} from './entities/area-execution.entity';
import {
  CreateAreaExecutionDto,
  UpdateAreaExecutionDto,
  AreaExecutionResponseDto,
} from './dto';
import { AreasService } from '../areas/areas.service';

@Injectable()
export class AreaExecutionsService {
  constructor(
    @InjectRepository(AreaExecution)
    private readonly areaExecutionRepository: Repository<AreaExecution>,
    private readonly areasService: AreasService,
  ) {}

  async create(
    createAreaExecutionDto: CreateAreaExecutionDto,
  ): Promise<AreaExecutionResponseDto> {
    const areaExecution = this.areaExecutionRepository.create({
      ...createAreaExecutionDto,
      status: createAreaExecutionDto.status || ExecutionStatus.PENDING,
      startedAt: createAreaExecutionDto.startedAt || new Date(),
    });

    const savedExecution =
      await this.areaExecutionRepository.save(areaExecution);

    // Increment the trigger count for the area
    await this.areasService.incrementTriggerCount(savedExecution.areaId);

    return new AreaExecutionResponseDto(savedExecution);
  }

  async findAll(): Promise<AreaExecutionResponseDto[]> {
    const executions = await this.areaExecutionRepository.find({});
    return executions.map(
      (execution) => new AreaExecutionResponseDto(execution),
    );
  }

  async findOne(id: number): Promise<AreaExecutionResponseDto> {
    const execution = await this.areaExecutionRepository.findOne({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException(`AreaExecution with ID ${id} not found`);
    }

    return new AreaExecutionResponseDto(execution);
  }

  async findByAreaId(areaId: number): Promise<AreaExecutionResponseDto[]> {
    const executions = await this.areaExecutionRepository.find({
      where: { areaId: areaId },
    });
    return executions.map(
      (execution) => new AreaExecutionResponseDto(execution),
    );
  }

  async findByStatus(
    status: ExecutionStatus,
  ): Promise<AreaExecutionResponseDto[]> {
    const executions = await this.areaExecutionRepository.find({
      where: { status },
    });
    return executions.map(
      (execution) => new AreaExecutionResponseDto(execution),
    );
  }

  async findRecentExecutions(
    limit: number = 50,
  ): Promise<AreaExecutionResponseDto[]> {
    const executions = await this.areaExecutionRepository.find({
      take: limit,
    });
    return executions.map(
      (execution) => new AreaExecutionResponseDto(execution),
    );
  }

  async findLongRunningExecutions(
    thresholdMinutes: number = 30,
  ): Promise<AreaExecutionResponseDto[]> {
    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - thresholdMinutes);

    const executions = await this.areaExecutionRepository
      .createQueryBuilder('execution')
      .where('execution.status = :status', { status: ExecutionStatus.RUNNING })
      .andWhere('execution.started_at < :threshold', {
        threshold: thresholdDate,
      })
      .orderBy('execution.started_at', 'ASC')
      .getMany();

    return executions.map(
      (execution) => new AreaExecutionResponseDto(execution),
    );
  }

  async findFailedExecutions(
    areaId?: number,
  ): Promise<AreaExecutionResponseDto[]> {
    const whereCondition: FindOptionsWhere<AreaExecution> = {
      status: ExecutionStatus.FAILED,
    };

    if (areaId !== undefined) {
      whereCondition.areaId = areaId;
    }

    const executions = await this.areaExecutionRepository.find({
      where: whereCondition,
    });
    return executions.map(
      (execution) => new AreaExecutionResponseDto(execution),
    );
  }

  async update(
    id: number,
    updateAreaExecutionDto: UpdateAreaExecutionDto,
  ): Promise<AreaExecutionResponseDto> {
    const execution = await this.areaExecutionRepository.findOne({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException(`AreaExecution with ID ${id} not found`);
    }

    // Auto-calculate execution time if completing
    if (
      updateAreaExecutionDto.status === ExecutionStatus.SUCCESS &&
      execution.startedAt
    ) {
      const completedAt = updateAreaExecutionDto.completedAt || new Date();
      updateAreaExecutionDto.executionTimeMs =
        completedAt.getTime() - execution.startedAt.getTime();
      updateAreaExecutionDto.completedAt = completedAt;
    }

    Object.assign(execution, updateAreaExecutionDto);
    const updatedExecution = await this.areaExecutionRepository.save(execution);
    return new AreaExecutionResponseDto(updatedExecution);
  }

  async startExecution(id: number): Promise<AreaExecutionResponseDto> {
    return this.update(id, {
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
    });
  }

  async completeExecution(
    id: number,
    executionResult?: Record<string, any>,
  ): Promise<AreaExecutionResponseDto> {
    return this.update(id, {
      status: ExecutionStatus.SUCCESS,
      completedAt: new Date(),
      executionResult,
    });
  }

  async failExecution(
    id: number,
    errorMessage: string,
  ): Promise<AreaExecutionResponseDto> {
    return this.update(id, {
      status: ExecutionStatus.FAILED,
      completedAt: new Date(),
      errorMessage,
    });
  }

  async cancelExecution(id: number): Promise<AreaExecutionResponseDto> {
    return this.update(id, {
      status: ExecutionStatus.CANCELLED,
      completedAt: new Date(),
    });
  }

  async remove(id: number): Promise<void> {
    const execution = await this.areaExecutionRepository.findOne({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException(`AreaExecution with ID ${id} not found`);
    }

    await this.areaExecutionRepository.remove(execution);
  }

  async removeByAreaId(areaId: number): Promise<void> {
    await this.areaExecutionRepository.delete({ areaId: areaId });
  }

  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.areaExecutionRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoff', { cutoff: cutoffDate })
      .andWhere('status IN (:...statuses)', {
        statuses: [
          ExecutionStatus.SUCCESS,
          ExecutionStatus.FAILED,
          ExecutionStatus.CANCELLED,
        ],
      })
      .execute();

    return result.affected || 0;
  }

  async getExecutionStats(areaId?: number): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgExecutionTimeMs: number | null;
  }> {
    let query = this.areaExecutionRepository.createQueryBuilder('execution');

    if (areaId) {
      query = query.where('execution.area_id = :areaId', { areaId });
    }

    const [total, pending, running, completed, failed, cancelled] =
      await Promise.all([
        query.getCount(),
        query
          .clone()
          .andWhere('execution.status = :status', {
            status: ExecutionStatus.PENDING,
          })
          .getCount(),
        query
          .clone()
          .andWhere('execution.status = :status', {
            status: ExecutionStatus.RUNNING,
          })
          .getCount(),
        query
          .clone()
          .andWhere('execution.status = :status', {
            status: ExecutionStatus.SUCCESS,
          })
          .getCount(),
        query
          .clone()
          .andWhere('execution.status = :status', {
            status: ExecutionStatus.FAILED,
          })
          .getCount(),
        query
          .clone()
          .andWhere('execution.status = :status', {
            status: ExecutionStatus.CANCELLED,
          })
          .getCount(),
      ]);

    // Calculate average execution time for completed executions
    const avgQuery = query
      .clone()
      .select('AVG(execution.execution_time_ms)', 'avg')
      .andWhere('execution.status = :status', {
        status: ExecutionStatus.SUCCESS,
      })
      .andWhere('execution.execution_time_ms IS NOT NULL');

    const avgResult = await avgQuery.getRawOne<{ avg: string | null }>();
    const avgExecutionTimeMs = avgResult?.avg ? Number(avgResult.avg) : null;

    return {
      total,
      pending,
      running,
      completed,
      failed,
      cancelled,
      avgExecutionTimeMs,
    };
  }
}
