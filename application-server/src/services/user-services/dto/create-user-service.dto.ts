import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDate } from 'class-validator';

export class CreateUserServiceDto {
  @ApiProperty({
    description: 'ID of the user owning the service',
    example: 1,
  })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'ID of the service being connected',
    example: 1,
  })
  @IsNumber()
  service_id: number;

  @ApiPropertyOptional({
    description: 'OAuth token for the service',
    example: 'oauth_token',
  })
  @IsString()
  @IsOptional()
  oauth_token?: string;

  @ApiPropertyOptional({
    description: 'Refresh token for the service',
    example: 'refresh_token',
  })
  @IsString()
  @IsOptional()
  refresh_token?: string;

  @ApiPropertyOptional({
    description: 'Expiration date of the token',
    example: '2023-01-01T00:00:00Z',
  })
  @IsDate()
  @IsOptional()
  token_expires_at?: Date;
}
