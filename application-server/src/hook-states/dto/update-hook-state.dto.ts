import { PartialType } from '@nestjs/mapped-types';
import { CreateHookStateDto } from './create-hook-state.dto';

export class UpdateHookStateDto extends PartialType(CreateHookStateDto) {}
