import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  username: string;

  @ApiPropertyOptional({
    description: 'URL to the user profile icon',
    example: 'https://example.com/avatars/user123.png',
  })
  icon_url?: string;

  @ApiProperty({
    description: 'Whether the user has administrator privileges',
    example: false,
  })
  is_admin: boolean;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Timestamp when the user account was created',
    example: '2024-01-10T08:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the user account was last updated',
    example: '2024-01-20T14:30:00.000Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Timestamp of the last user connection',
    example: '2024-01-25T10:15:00.000Z',
  })
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
