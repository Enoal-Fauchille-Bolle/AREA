export class ServiceResponseDto {
  id: number;
  name: string;
  description: string | null;
  icon_path: string | null;
  requires_auth: boolean;
  is_active: boolean;
}
