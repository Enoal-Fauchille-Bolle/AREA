import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserService } from '../entities/user-service.entity';
import { User } from '../../../users/entities/user.entity';
import { Service } from '../../../services/entities/service.entity';
import { UserResponseDto } from '../../../users/dto/user-response.dto';
import { ServiceResponseDto } from '../../../services/dto';

class UserDto {
  @ApiProperty({
    description: 'ID of the user',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'john_doe@example.com',
  })
  email: string;

  constructor(data: UserDto) {
    Object.assign(this, data);
  }

  static fromEntity(user: User): UserDto {
    return new UserDto({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  }

  static fromResponseDto(user: UserResponseDto): UserDto {
    return new UserDto({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  }
}

class ServiceDto {
  @ApiProperty({
    description: 'ID of the service',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Name of the service',
    example: 'GitHub',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the service',
    example: 'A platform for version control and collaboration',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Indicates if the service requires authentication',
    example: true,
  })
  requires_auth: boolean;

  constructor(data: ServiceDto) {
    Object.assign(this, data);
  }

  static fromEntity(service: Service): ServiceDto {
    return new ServiceDto({
      id: service.id,
      name: service.name,
      description: service.description,
      requires_auth: service.requires_auth,
    });
  }

  static fromResponseDto(service: ServiceResponseDto): ServiceDto {
    return new ServiceDto({
      id: service.id,
      name: service.name,
      description: service.description,
      requires_auth: service.requires_auth,
    });
  }
}

export class UserServiceResponseDto {
  @ApiPropertyOptional({
    description: 'OAuth token for the service',
    example: 'oauth_token',
  })
  oauth_token: string | null;

  @ApiPropertyOptional({
    description: 'Refresh token for the service',
    example: 'refresh_token',
  })
  refresh_token: string | null;

  @ApiPropertyOptional({
    description: 'Expiration date of the token',
    example: '2023-01-01T00:00:00Z',
  })
  token_expires_at: Date | null;

  @ApiProperty({
    description: 'Date when the user service was created',
    example: '2023-01-01T00:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Date when the user service was last updated',
    example: '2023-01-02T00:00:00Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Information about the user',
    type: UserDto,
  })
  user: UserDto;

  @ApiProperty({
    description: 'Information about the service',
    type: ServiceDto,
  })
  service: ServiceDto;

  constructor(data: UserServiceResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(userService: UserService): UserServiceResponseDto {
    return new UserServiceResponseDto({
      oauth_token: userService.oauth_token,
      refresh_token: userService.refresh_token,
      token_expires_at: userService.token_expires_at,
      created_at: userService.created_at,
      updated_at: userService.updated_at,
      user: UserDto.fromEntity(userService.user),
      service: ServiceDto.fromEntity(userService.service),
    });
  }

  static fromResponseDtos(
    user: UserResponseDto,
    service: ServiceResponseDto,
    tokenData: UserService,
  ): UserServiceResponseDto {
    return new UserServiceResponseDto({
      oauth_token: tokenData.oauth_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.token_expires_at,
      created_at: new Date(),
      updated_at: new Date(),
      user: UserDto.fromResponseDto(user),
      service: ServiceDto.fromResponseDto(service),
    });
  }
}
