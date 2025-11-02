import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Variable,
  VariableKind,
  VariableType,
} from '../entities/variable.entity';

export class VariableResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the variable',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'ID of the component this variable belongs to',
    example: 5,
    type: 'integer',
  })
  component_id: number;

  @ApiProperty({
    description: 'Name of the variable',
    example: 'repository_name',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the variable',
    example: 'Name of the GitHub repository',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Kind of variable (parameter/return_value)',
    enum: VariableKind,
    example: VariableKind.PARAMETER,
  })
  kind: VariableKind;

  @ApiProperty({
    description: 'Data type of the variable',
    enum: VariableType,
    example: VariableType.STRING,
  })
  type: VariableType;

  @ApiProperty({
    description: 'Whether the variable is optional',
    example: false,
  })
  optional: boolean;

  @ApiPropertyOptional({
    description: 'Placeholder text for the variable input',
    example: 'Enter repository name',
    nullable: true,
  })
  placeholder: string | null;

  @ApiPropertyOptional({
    description: 'Regular expression for validating the variable value',
    example: '^[a-zA-Z0-9_-]+$',
    nullable: true,
  })
  validation_regex: string | null;

  @ApiProperty({
    description: 'Display order for the variable in UI',
    example: 0,
    type: 'integer',
  })
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
