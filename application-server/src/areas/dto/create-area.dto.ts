export class CreateAreaDto {
  component_action_id: number;
  component_reaction_id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}