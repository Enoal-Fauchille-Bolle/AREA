import { ExecutionStatus } from '../entities/area-execution.entity';

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

  constructor(areaExecution: any) {
    this.id = areaExecution.id;
    this.areaId = areaExecution.areaId;
    this.status = areaExecution.status;
    this.triggerData = areaExecution.triggerData;
    this.executionResult = areaExecution.executionResult;
    this.errorMessage = areaExecution.errorMessage;
    this.startedAt = areaExecution.startedAt;
    this.completedAt = areaExecution.completedAt;
    this.executionTimeMs = areaExecution.executionTimeMs
      ? Number(areaExecution.executionTimeMs)
      : null;
    this.createdAt = areaExecution.createdAt;
    this.updatedAt = areaExecution.updatedAt;
  }
}
