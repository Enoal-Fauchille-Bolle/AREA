export class UserServiceResponseDto {
  id: number;
  user_id: number;
  service_id: number;
  oauth_token: string;
  refresh_token: string | null;
  token_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  service?: {
    id: number;
    name: string;
    description: string;
  };
}