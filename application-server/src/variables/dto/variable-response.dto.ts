import {
  Variable,
  VariableKind,
  VariableType,
} from '../entities/variable.entity';

export class VariableResponseDto {
  id: number;
  component_id: number;
  name: string;
  description: string | null;
  kind: VariableKind;
  type: VariableType;
  optional: boolean;
  placeholder: string | null;
  validation_regex: string | null;
  display_order: number;

  constructor(data: VariableResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(variable: Variable): VariableResponseDto {
    return new VariableResponseDto({
      id: variable.id,
      component_id: variable.component_id,
      name: variable.name,
      description: variable.description,
      kind: variable.kind,
      type: variable.type,
      optional: variable.nullable,
      placeholder: variable.placeholder,
      validation_regex: variable.validation_regex,
      display_order: variable.display_order,
    });
  }
}
