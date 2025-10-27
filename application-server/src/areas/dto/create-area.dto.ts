import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateAreaDto {
  @ApiProperty({
    description: 'The action component ID for the AREA',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  component_action_id: number;

  @ApiProperty({
    description: 'The reaction component ID for the AREA',
    example: 2,
  })
  @IsInt()
  @IsNotEmpty()
  component_reaction_id: number;

  @ApiProperty({
    description: 'The name of the AREA',
    example: 'My First AREA',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the AREA',
    example: 'This is my first AREA',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the AREA is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
