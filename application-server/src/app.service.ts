import { Injectable } from '@nestjs/common';
import { ServicesService } from './services/services.service';
import { ComponentsService } from './components/components.service';
import { VariablesService } from './variables/variables.service';
import { ComponentType } from './components/entities/component.entity';
import type { Request } from 'express';

@Injectable()
export class AppService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly componentsService: ComponentsService,
    private readonly variablesService: VariablesService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getAbout(request: Request): Promise<any> {
    const clientHost =
      request.ip || request.connection.remoteAddress || '127.0.0.1';
    const currentTime = Math.floor(Date.now() / 1000); // Unix timestamp

    // Get all active services
    const services = await this.servicesService.findActive();

    // Build services array with actions and reactions
    const servicesData = await Promise.all(
      services.map(async (service) => {
        const components = await this.componentsService.findByService(
          service.id,
        );

        const actions = components
          .filter((component) => component.kind === ComponentType.ACTION)
          .map((component) => ({
            name: component.name,
            description: component.description || '',
          }));

        const reactions = components
          .filter((component) => component.kind === ComponentType.REACTION)
          .map((component) => ({
            name: component.name,
            description: component.description || '',
          }));

        return {
          name: service.name.toLowerCase(),
          actions,
          reactions,
        };
      }),
    );

    return {
      client: {
        host: clientHost,
      },
      server: {
        current_time: currentTime,
        services: servicesData,
      },
    };
  }
}
