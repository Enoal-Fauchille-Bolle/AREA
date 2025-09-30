import { ComponentType } from '../entities/component.entity';

export class ComponentResponseDto {
  id: number;
  service_id: number;
  type: ComponentType;
  name: string;
  description: string | null;
  is_active: boolean;
  webhook_endpoint: string | null;
  polling_interval: number | null;
  service?: {
    id: number;
    name: string;
    description: string | null;
  };
}