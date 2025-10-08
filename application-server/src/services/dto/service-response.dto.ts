import { ApiProperty } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DB_COLUMN_LENGTHS, DB_DEFAULTS, type AppConfig } from '../../config';
import { Service } from '../entities/service.entity';

export class ServiceResponseDto {
  @ApiProperty({
    description: 'Unique service identifier',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Service name (must be unique)',
    example: 'GitHub',
    maxLength: DB_COLUMN_LENGTHS.serviceName,
  })
  name: string;

  @ApiProperty({
    description: 'Service description',
    example: 'Version control service',
    nullable: true,
    required: false,
  })
  description: string | null;

  @ApiProperty({
    description: 'Full URL to service icon',
    example: 'http://127.0.0.1:8080/assets/services/GitHubIcon.svg',
    nullable: true,
    required: false,
  })
  icon_url: string | null;

  @ApiProperty({
    description: 'Whether service requires OAuth2 authentification',
    example: false,
    default: DB_DEFAULTS.requiresAuth,
  })
  requires_auth: boolean;

  @ApiProperty({
    description: 'Whether service is currently active',
    example: true,
    default: DB_DEFAULTS.isActive,
  })
  is_active: boolean;

  constructor(data: ServiceResponseDto) {
    Object.assign(this, data);
  }

  static fromEntity(
    service: Service,
    configService: ConfigService,
  ): ServiceResponseDto {
    const appConfig = configService.get<AppConfig>('app');
    if (!appConfig) {
      throw new Error('App configuration is not properly loaded');
    }
    const icon_url = service.icon_path
      ? `${appConfig.serverUrl}/${service.icon_path}`
      : null;

    return new ServiceResponseDto({
      id: service.id,
      name: service.name,
      description: service.description,
      icon_url,
      requires_auth: service.requires_auth,
      is_active: service.is_active,
    });
  }
}
