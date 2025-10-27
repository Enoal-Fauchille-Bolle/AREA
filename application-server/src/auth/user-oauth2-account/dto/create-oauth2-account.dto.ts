import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOAuth2AccountDto {
  @ApiProperty({
    description: "ID of the user's AREA account",
    example: 1,
  })
  @IsNumber()
  user_id: number;

  @ApiProperty({
    description: 'ID of the OAuth2 account service',
    example: 1,
  })
  @IsNumber()
  service_id: number;

  @ApiProperty({
    description: 'The user ID provided by the OAuth2 provider for this account',
    example: '1234567890',
  })
  @IsString()
  oauth2_provider_user_id: string;

  @ApiPropertyOptional({
    description: 'The email associated with this OAuth2 account',
    example: 'user@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;
}
