import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExecutionStatus,
  AreaExecution,
} from '../entities/area-execution.entity';

export class AreaExecutionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the execution',
    example: 123,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'ID of the AREA being executed',
    example: 1,
    type: 'integer',
  })
  areaId: number;

  @ApiProperty({
    description: 'Current status of the execution',
    enum: ExecutionStatus,
    example: ExecutionStatus.SUCCESS,
  })
  status: ExecutionStatus;

  @ApiProperty({
    description: 'Data that triggered the AREA execution',
    example: { issue_number: 42, title: 'Bug found' },
  })
  triggerData: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Result data from the execution',
    example: { message_id: '987654321', success: true },
    nullable: true,
  })
  executionResult: Record<string, any> | null;

  @ApiPropertyOptional({
    description: 'Error message if execution failed',
    example: 'Network timeout',
    nullable: true,
  })
  errorMessage: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when execution started',
    example: '2024-01-25T10:30:00.000Z',
    nullable: true,
  })
  startedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when execution completed',
    example: '2024-01-25T10:30:05.000Z',
    nullable: true,
  })
  completedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Execution duration in milliseconds',
    example: 5000,
    type: 'integer',
    nullable: true,
  })
  executionTimeMs: number | null;

  @ApiProperty({
    description: 'Timestamp when execution record was created',
    example: '2024-01-25T10:29:59.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when execution record was last updated',
    example: '2024-01-25T10:30:05.000Z',
  })
  updatedAt: Date;

  constructor(areaExecution: AreaExecution) {
    this.id = areaExecution.id;
    this.areaId = areaExecution.areaId;
    this.status = areaExecution.status;
    this.triggerData = areaExecution.triggerData ?? {};
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
