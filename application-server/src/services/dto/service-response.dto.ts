import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config';
import { Service } from '../entities/service.entity';

export class ServiceResponseDto {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  requires_auth: boolean;
  is_active: boolean;

  static fromEntity(
    service: Service,
    configService: ConfigService,
  ): ServiceResponseDto {
    const appConfig = configService.get<AppConfig>('app');
    const icon_url = `${appConfig.serverUrl}/${service.icon_path}`;

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      icon_url,
      requires_auth: service.requires_auth,
      is_active: service.is_active,
    };
  }
}
