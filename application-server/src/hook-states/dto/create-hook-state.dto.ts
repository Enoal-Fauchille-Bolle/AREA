export class CreateHookStateDto {
  area_id: number;
  state_key: string;
  state_value: string;
  last_checked_at?: Date;
}