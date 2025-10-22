export class AreaParameterResponseDto {
  area_id: number;
  variable_id: number;
  value: string;
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
