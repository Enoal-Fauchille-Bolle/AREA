import { PartialType } from '@nestjs/swagger';
import { CreateAreaExecutionDto } from './create-area-execution.dto';

/**
 * UpdateAreaExecutionDto allows updating the following fields:
 * - status
 * - executionResult
 * - errorMessage
 * - startedAt
 * - completedAt
 * - executionTimeMs
 */
export class UpdateAreaExecutionDto extends PartialType(
  CreateAreaExecutionDto,
) {}
