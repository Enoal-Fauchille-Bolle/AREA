export class CreateServiceDto {
  name: string;
  description: string;
  icon_path?: string;
  requires_auth?: boolean;
  is_active?: boolean;
}