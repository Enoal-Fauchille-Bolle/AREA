import { PartialType } from '@nestjs/mapped-types';
import { CreateAreaExecutionDto } from './create-area-execution.dto';
import { ExecutionStatus } from '../entities/area-execution.entity';

export class UpdateAreaExecutionDto extends PartialType(
  CreateAreaExecutionDto,
) {
  status?: ExecutionStatus;
  executionResult?: Record<string, any>;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  executionTimeMs?: number;
}
