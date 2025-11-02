import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Username for the user',
    example: 'johndoe',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Path to user icon/avatar',
    example: '/avatars/user-123.png',
  })
  @IsString()
  @IsOptional()
  icon_path?: string;

  @ApiPropertyOptional({
    description: 'Whether the user has admin privileges',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_admin?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
