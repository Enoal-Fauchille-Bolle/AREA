import { ExecutionStatus } from '../entities/area-execution.entity';

export class CreateAreaExecutionDto {
  areaId: number;
  status?: ExecutionStatus;
  triggerData: Record<string, any>;
  executionResult?: Record<string, any>;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  executionTimeMs?: number;
}