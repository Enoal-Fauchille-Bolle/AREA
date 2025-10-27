import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsStrongPassword,
  IsNotEmpty,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'The new email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({
    description: 'The new username of the user',
    example: 'new_username',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  username?: string;

  @ApiPropertyOptional({
    description: 'The new password for the user account',
    example: 'NewStr0ngP@ss!',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'The new profile picture URL',
    example: 'https://example.com/path/to/avatar.png',
  })
  @IsUrl({ require_tld: false })
  @IsOptional()
  @IsNotEmpty()
  icon_url?: string;
}
