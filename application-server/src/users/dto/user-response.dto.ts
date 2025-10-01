import { User } from '../entities/user.entity';

export class UserResponseDto {
  id: number;
  email: string;
  username: string;
  icon_url?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_connection_at?: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.icon_url = user.icon_path ?? undefined; // Map icon_path to icon_url for API consistency
    this.is_admin = user.is_admin;
    this.is_active = user.is_active;
    this.created_at = user.created_at;
    this.updated_at = user.updated_at;
    this.last_connection_at = user.last_connection_at ?? undefined;
    // Note: password_hash is intentionally excluded
  }
}
