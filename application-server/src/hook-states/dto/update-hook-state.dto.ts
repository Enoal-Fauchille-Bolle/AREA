import { PartialType } from '@nestjs/swagger';
import { CreateHookStateDto } from './create-hook-state.dto';

export class UpdateHookStateDto extends PartialType(CreateHookStateDto) {}
