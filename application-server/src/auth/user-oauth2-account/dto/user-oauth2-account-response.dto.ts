import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DB_COLUMN_LENGTHS } from '../../../config';
import { type UserOAuth2Account } from '../entities/user-oauth2-account.entity';
import { type User } from '../../../users/entities/user.entity';
import { type Service } from '../../../services/entities/service.entity';
import { UserResponseDto } from '../../../users/dto/user-response.dto';
import { ServiceResponseDto } from '../../../services/dto/service-response.dto';
import { OAuth2ResponseDto } from '../../../oauth2/dto/oauth2-response.dto';

class UserDto {
  @ApiProperty({
    description: 'ID of the user',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Username of the user',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@example.com',
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
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Name of the service',
    example: 'GitHub',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the service',
    example: 'Version control service',
    nullable: true,
  })
  description: string | null;

  constructor(data: ServiceDto) {
    Object.assign(this, data);
  }

  static fromEntity(service: Service): ServiceDto {
    return new ServiceDto({
      id: service.id,
      name: service.name,
      description: service.description,
    });
  }

  static fromResponseDto(service: ServiceResponseDto): ServiceDto {
    return new ServiceDto({
      id: service.id,
      name: service.name,
      description: service.description,
    });
  }
}

export class UserOAuth2AccountResponseDto {
  @ApiProperty({
    description: `The user ID provided by the OAuth2 provider for this account`,
    example: '1234567890',
    maxLength: DB_COLUMN_LENGTHS.oauth2ProviderUserId,
  })
  oauth2_provider_user_id: string;

  @ApiPropertyOptional({
    description: 'The email associated with this OAuth2 account',
    example: 'user@example.com',
    maxLength: DB_COLUMN_LENGTHS.email,
  })
  email: string | null;

  @ApiProperty({
    description: `The creation date of this OAuth2 account`,
    example: '2023-01-01T00:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Information about the OAuth2 account user',
    type: UserDto,
  })
  user: UserDto;

  @ApiProperty({
    description: 'Information about the OAuth2 service',
    type: ServiceDto,
  })
  service: ServiceDto;

  constructor(data: UserOAuth2AccountResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(entity: UserOAuth2Account): UserOAuth2AccountResponseDto {
    return new UserOAuth2AccountResponseDto({
      oauth2_provider_user_id: entity.service_account_id,
      email: entity.email,
      created_at: entity.created_at,
      user: UserDto.fromEntity(entity.user),
      service: ServiceDto.fromEntity(entity.service),
    });
  }

  static fromResponseDtos(
    user: UserResponseDto,
    service: ServiceResponseDto,
    providerInfo: Pick<OAuth2ResponseDto, 'id' | 'email'>,
  ): UserOAuth2AccountResponseDto {
    return new UserOAuth2AccountResponseDto({
      oauth2_provider_user_id: providerInfo.id,
      email: providerInfo.email,
      created_at: new Date(),
      user: UserDto.fromResponseDto(user),
      service: ServiceDto.fromResponseDto(service),
    });
  }
}
