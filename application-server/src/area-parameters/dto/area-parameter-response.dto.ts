export class AreaParameterResponseDto {
  area_id: number;
  variable_id: number;
  value: string;
  is_template: boolean;
  created_at: Date;
  updated_at: Date;
  variable?: {
    id: number;
    name: string;
    kind: string;
    type: string;
  };
}