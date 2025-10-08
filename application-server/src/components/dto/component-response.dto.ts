import { Component, ComponentType } from '../entities/component.entity';

export class ComponentResponseDto {
  id: number;
  service_id: number;
  kind: ComponentType;
  name: string;
  description: string | null;
  is_active: boolean;
  webhook_endpoint: string | null;
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
