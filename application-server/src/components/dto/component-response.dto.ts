import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Component, ComponentType } from '../entities/component.entity';

export class ComponentResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the component',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'ID of the service this component belongs to',
    example: 2,
    type: 'integer',
  })
  service_id: number;

  @ApiProperty({
    description: 'Type of component (action or reaction)',
    enum: ComponentType,
    example: ComponentType.ACTION,
  })
  kind: ComponentType;

  @ApiProperty({
    description: 'Name of the component',
    example: 'New GitHub Issue',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of what the component does',
    example: 'Triggered when a new issue is created in a repository',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether the component is currently active',
    example: true,
  })
  is_active: boolean;

  @ApiPropertyOptional({
    description: 'Webhook endpoint for this component (if webhook-based)',
    example: '/webhooks/github/issues',
    nullable: true,
  })
  webhook_endpoint: string | null;

  @ApiPropertyOptional({
    description: 'Polling interval in seconds (if polling-based)',
    example: 300,
    type: 'integer',
    nullable: true,
  })
  polling_interval: number | null;

  constructor(data: ComponentResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(component: Component): ComponentResponseDto {
    return new ComponentResponseDto({
      id: component.id,
      service_id: component.service_id,
      kind: component.type,
      name: component.name,
      description: component.description,
      is_active: component.is_active,
      webhook_endpoint: component.webhook_endpoint,
      polling_interval: component.polling_interval,
    });
  }
}
