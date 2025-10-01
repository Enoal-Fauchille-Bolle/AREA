import { VariableKind, VariableType } from '../entities/variable.entity';

export class VariableResponseDto {
  id: number;
  component_id: number;
  name: string;
  description: string | null;
  kind: VariableKind;
  type: VariableType | null;
  nullable: boolean;
  placeholder: string | null;
  validation_regex: string | null;
  display_order: number;
  component?: {
    id: number;
    name: string;
    type: string;
  };
}
