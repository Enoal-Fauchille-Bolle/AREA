export class CreateUserDto {
  email: string;
  username: string;
  password: string;
  icon_path?: string;
  is_admin?: boolean;
  is_active?: boolean;
}
