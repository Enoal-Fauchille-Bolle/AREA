export class CreateUserServiceDto {
  user_id: number;
  service_id: number;
  oauth_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
}
