export class UserResponseDto {
  id: number;
  email: string;
  username: string;
  icon_path?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_connection_at?: Date;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.icon_path = user.icon_path;
    this.is_admin = user.is_admin;
    this.is_active = user.is_active;
    this.created_at = user.created_at;
    this.updated_at = user.updated_at;
    this.last_connection_at = user.last_connection_at;
    // Note: password_hash is intentionally excluded
  }
}
