import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AreaParameterResponseDto {
  @ApiProperty({
    description: 'ID of the AREA this parameter belongs to',
    example: 1,
    type: 'integer',
  })
  area_id: number;

  @ApiProperty({
    description: 'ID of the variable this parameter configures',
    example: 5,
    type: 'integer',
  })
  variable_id: number;

  @ApiProperty({
    description: 'Value of the parameter',
    example: 'my-repository',
  })
  value: string;

  @ApiPropertyOptional({
    description: 'Variable details (included when requested)',
    type: 'object',
    properties: {
      id: { type: 'integer', example: 5 },
      component_id: { type: 'integer', example: 2 },
      name: { type: 'string', example: 'repository_name' },
      description: {
        type: 'string',
        example: 'Name of the GitHub repository',
        nullable: true,
      },
      kind: { type: 'string', example: 'INPUT' },
      type: { type: 'string', example: 'STRING' },
      nullable: { type: 'boolean', example: false },
      placeholder: {
        type: 'string',
        example: 'Enter repository name',
        nullable: true,
      },
      validation_regex: {
        type: 'string',
        example: '^[a-zA-Z0-9_-]+$',
        nullable: true,
      },
      display_order: { type: 'integer', example: 0 },
    },
  })
  variable?: {
    id: number;
    component_id: number;
    name: string;
    description: string | null;
    kind: string;
    type: string;
    nullable: boolean;
    placeholder: string | null;
    validation_regex: string | null;
    display_order: number;
  };
}
