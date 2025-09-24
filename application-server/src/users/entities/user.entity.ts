export class User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  icon_path?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_connection_at?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}