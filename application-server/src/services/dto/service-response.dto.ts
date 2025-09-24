export class ServiceResponseDto {
  id: number;
  name: string;
  description: string;
  icon_path: string | null;
  requires_auth: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}