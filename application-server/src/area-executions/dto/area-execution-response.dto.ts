import {
  ExecutionStatus,
  AreaExecution,
} from '../entities/area-execution.entity';

export class AreaExecutionResponseDto {
  id: number;
  areaId: number;
  status: ExecutionStatus;
  triggerData: Record<string, any>;
  executionResult: Record<string, any> | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  executionTimeMs: number | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(areaExecution: AreaExecution) {
    this.id = areaExecution.id;
    this.areaId = areaExecution.area_id;
    this.status = areaExecution.status;
    this.triggerData = areaExecution.trigger_data ?? {};
    this.executionResult = areaExecution.execution_result;
    this.errorMessage = areaExecution.error_message;
    this.startedAt = areaExecution.started_at;
    this.completedAt = areaExecution.completed_at;
    this.executionTimeMs = areaExecution.execution_time_ms
      ? Number(areaExecution.execution_time_ms)
      : null;
    this.createdAt = areaExecution.createdAt;
    this.updatedAt = areaExecution.updatedAt;
  }
}
