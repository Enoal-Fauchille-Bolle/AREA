import { Area } from '../entities/area.entity';

export class AreaResponseDto {
  id: number;
  user_id: number;
  component_action_id: number;
  component_reaction_id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_triggered_at: Date | null;
  triggered_count: number;

  constructor(area: Area) {
    this.id = area.id;
    this.user_id = area.user_id;
    this.component_action_id = area.component_action_id;
    this.component_reaction_id = area.component_reaction_id;
    this.name = area.name;
    this.description = area.description;
    this.is_active = area.is_active;
    this.created_at = area.created_at;
    this.updated_at = area.updated_at;
    this.last_triggered_at = area.last_triggered_at;
    this.triggered_count = area.triggered_count;
  }
}