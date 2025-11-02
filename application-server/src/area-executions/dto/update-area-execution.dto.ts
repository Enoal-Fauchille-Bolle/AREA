import { PartialType } from '@nestjs/swagger';
import { CreateAreaExecutionDto } from './create-area-execution.dto';

export class UpdateAreaExecutionDto extends PartialType(
  CreateAreaExecutionDto,
) {}
