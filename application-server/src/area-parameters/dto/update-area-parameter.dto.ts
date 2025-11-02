import { PartialType } from '@nestjs/swagger';
import { CreateAreaParameterDto } from './create-area-parameter.dto';

export class UpdateAreaParameterDto extends PartialType(
  CreateAreaParameterDto,
) {}
