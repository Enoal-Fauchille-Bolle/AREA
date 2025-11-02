import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ComponentType } from '../entities/component.entity';

export class CreateComponentDto {
  @ApiProperty({
    description: 'ID of the service this component belongs to',
    example: 2,
    type: 'integer',
  })
  @IsInt()
  service_id: number;

  @ApiProperty({
    description: 'Type of component',
    enum: ComponentType,
    example: ComponentType.ACTION,
  })
  @IsEnum(ComponentType)
  type: ComponentType;

  @ApiProperty({
    description: 'Name of the component',
    example: 'New GitHub Issue',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of what the component does',
    example: 'Triggered when a new issue is created in a repository',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the component should be active upon creation',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Webhook endpoint for this component (if webhook-based)',
    example: '/webhooks/github/issues',
  })
  @IsString()
  @IsOptional()
  webhook_endpoint?: string;

  @ApiPropertyOptional({
    description: 'Polling interval in seconds (if polling-based)',
    example: 300,
    type: 'integer',
  })
  @IsNumber()
  @IsOptional()
  polling_interval?: number;
}
