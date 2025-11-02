import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { VariableKind, VariableType } from '../entities/variable.entity';

export class CreateVariableDto {
  @ApiProperty({
    description: 'ID of the component this variable belongs to',
    example: 1,
  })
  @IsInt()
  component_id: number;

  @ApiProperty({
    description: 'Variable name',
    example: 'channel_id',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the variable',
    example: 'The ID of the Discord channel',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description:
      'Kind of variable (parameter, trigger data, or reaction result)',
    enum: VariableKind,
    example: VariableKind.PARAMETER,
  })
  @IsEnum(VariableKind)
  kind: VariableKind;

  @ApiPropertyOptional({
    description: 'Data type of the variable',
    enum: VariableType,
    example: VariableType.STRING,
  })
  @IsEnum(VariableType)
  @IsOptional()
  type?: VariableType;

  @ApiPropertyOptional({
    description: 'Whether the variable can be null',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  nullable?: boolean;

  @ApiPropertyOptional({
    description: 'Placeholder text for the variable input',
    example: 'Enter channel ID',
  })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiPropertyOptional({
    description: 'Regular expression for validating the variable value',
    example: '^\\d+$',
  })
  @IsString()
  @IsOptional()
  validation_regex?: string;

  @ApiPropertyOptional({
    description: 'Display order for the variable in UI',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  display_order?: number;
}
