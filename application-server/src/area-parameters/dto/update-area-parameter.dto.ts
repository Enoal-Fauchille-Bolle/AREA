import { PartialType } from '@nestjs/mapped-types';
import { CreateAreaParameterDto } from './create-area-parameter.dto';

export class UpdateAreaParameterDto extends PartialType(
  CreateAreaParameterDto,
) {}
