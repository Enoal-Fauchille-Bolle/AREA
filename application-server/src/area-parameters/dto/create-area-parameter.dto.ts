import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAreaParameterDto {
  @ApiProperty({
    description: 'ID of the AREA this parameter belongs to',
    example: 1,
    type: 'integer',
  })
  @IsInt()
  area_id: number;

  @ApiProperty({
    description: 'ID of the variable this parameter configures',
    example: 5,
    type: 'integer',
  })
  @IsInt()
  variable_id: number;

  @ApiProperty({
    description: 'Value of the parameter',
    example: 'my-repository',
  })
  @IsString()
  value: string;

  @ApiPropertyOptional({
    description: 'Whether this parameter is a template (contains placeholders)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_template?: boolean;
}
