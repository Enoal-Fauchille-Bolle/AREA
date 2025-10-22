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
    const clientHost = this.getIpAddress(request);
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

  private getIpAddress(req: Request): string {
    // Check various headers and connection properties to find the IP address
    const ip =
      req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    // Fallback if no IP found or if it's an empty array
    if (
      !ip ||
      (typeof ip === 'string' && ip.trim() === '') ||
      (Array.isArray(ip) && ip.length === 0)
    ) {
      throw new Error('Unable to determine IP address');
    }

    // Handle cases where IP might be a list (e.g., "client, proxy1, proxy2")
    let ipAddress: string;
    if (Array.isArray(ip)) {
      ipAddress = ip[0];
    } else {
      ipAddress =
        typeof ip === 'string' ? ip.split(',')[0].trim() : (ip as string);
    }

    // Check if the extracted IP is empty after processing
    if (!ipAddress || ipAddress.trim() === '') {
      throw new Error('Unable to determine IP address');
    }

    // Remove IPv4-mapped IPv6 prefix if present
    if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }

    // Normalize localhost representation
    if (ipAddress === '::1') {
      ipAddress = '127.0.0.1';
    }

    return ipAddress;
  }
}
