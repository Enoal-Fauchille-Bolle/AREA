import { VariableKind, VariableType } from '../entities/variable.entity';

export class CreateVariableDto {
  component_id: number;
  name: string;
  description?: string;
  kind: VariableKind;
  type?: VariableType;
  nullable?: boolean;
  placeholder?: string;
  validation_regex?: string;
  display_order?: number;
}
