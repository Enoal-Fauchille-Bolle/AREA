export class UserOAuth2AccountResponseDto {
  user_id: number;
  service_id: number;
  email: string;
  created_at: Date;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  service?: {
    id: number;
    name: string;
    description: string | null;
  };
}
