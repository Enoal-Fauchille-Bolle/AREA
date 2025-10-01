import { ComponentType } from '../entities/component.entity';

export class CreateComponentDto {
  service_id: number;
  type: ComponentType;
  name: string;
  description?: string;
  is_active?: boolean;
  webhook_endpoint?: string;
  polling_interval?: number;
}
