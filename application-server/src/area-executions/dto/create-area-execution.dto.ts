import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsObject,
  IsString,
  IsDate,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExecutionStatus } from '../entities/area-execution.entity';

export class CreateAreaExecutionDto {
  @ApiProperty({
    description: 'ID of the AREA to execute',
    example: 1,
    type: 'integer',
  })
  @IsInt()
  areaId: number;

  @ApiPropertyOptional({
    description: 'Initial status of the execution',
    enum: ExecutionStatus,
    example: ExecutionStatus.PENDING,
    default: ExecutionStatus.PENDING,
  })
  @IsEnum(ExecutionStatus)
  @IsOptional()
  status?: ExecutionStatus;

  @ApiProperty({
    description: 'Data that triggered the execution',
    example: { issue_number: 42, title: 'Bug found' },
  })
  @IsObject()
  triggerData: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Result data from the execution',
    example: { message_id: '987654321', success: true },
  })
  @IsObject()
  @IsOptional()
  executionResult?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Error message if execution failed',
    example: 'Network timeout',
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when execution started',
    example: '2024-01-25T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Timestamp when execution completed',
    example: '2024-01-25T10:30:05.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Execution duration in milliseconds',
    example: 5000,
    type: 'integer',
  })
  @IsNumber()
  @IsOptional()
  executionTimeMs?: number;
}
