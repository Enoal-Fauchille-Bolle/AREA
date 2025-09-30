export class AreaParameterResponseDto {
  area_id: number;
  variable_id: number;
  value: string;
  variable?: {
    id: number;
    name: string;
    kind: string;
    type: string;
  };
}