import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import {
  Component,
  ComponentType,
} from '../components/entities/component.entity';
import { Variable } from '../variables/entities/variable.entity';
import { UserService } from '../user-services/entities/user-service.entity';
import {
  ServiceActionsResponseDto,
  ServiceReactionsResponseDto,
  ServiceComponentsResponseDto,
  ServiceResponseDto,
} from './dto';
import { ConfigService } from '@nestjs/config';
import { DiscordOAuth2Service } from './oauth2/discord-oauth2.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectRepository(Variable)
    private readonly variableRepository: Repository<Variable>,
    @InjectRepository(UserService)
    private readonly userServiceRepository: Repository<UserService>,
    private readonly configService: ConfigService,
    private readonly discordOAuth2Service: DiscordOAuth2Service,
  ) {}

  async findAll(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({});
    return services.map((service) =>
      ServiceResponseDto.fromEntity(service, this.configService),
    );
  }

  async findOne(id: number): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return ServiceResponseDto.fromEntity(service, this.configService);
  }

  async findAllActions(id: number): Promise<ServiceActionsResponseDto[]> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const components = await this.componentRepository.find({
      where: { service_id: id, type: ComponentType.ACTION },
    });

    const result: ServiceActionsResponseDto[] = [];

    for (const component of components) {
      const variables = await this.variableRepository.find({
        where: { component_id: component.id },
        order: { display_order: 'ASC' },
      });

      result.push(ServiceActionsResponseDto.fromEntity(component, variables));
    }

    return result;
  }

  async findAllReactions(id: number): Promise<ServiceReactionsResponseDto[]> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const components = await this.componentRepository.find({
      where: { service_id: id, type: ComponentType.REACTION },
    });

    const result: ServiceReactionsResponseDto[] = [];

    for (const component of components) {
      const variables = await this.variableRepository.find({
        where: { component_id: component.id },
        order: { display_order: 'ASC' },
      });

      result.push(ServiceReactionsResponseDto.fromEntity(component, variables));
    }

    return result;
  }

  async findAllComponents(id: number): Promise<ServiceComponentsResponseDto[]> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const components = await this.componentRepository.find({
      where: { service_id: id },
    });

    const result: ServiceComponentsResponseDto[] = [];

    for (const component of components) {
      const variables = await this.variableRepository.find({
        where: { component_id: component.id },
        order: { display_order: 'ASC' },
      });

      result.push(
        ServiceComponentsResponseDto.fromEntity(component, variables),
      );
    }

    return result;
  }

  async findUserServices(userId: number): Promise<ServiceResponseDto[]> {
    const userServices = await this.userServiceRepository.find({
      where: { user_id: userId },
      relations: ['service'],
    });

    return userServices.map((us) =>
      ServiceResponseDto.fromEntity(us.service, this.configService),
    );
  }

  async linkService(
    userId: number,
    serviceId: number,
    code?: string,
  ): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const existing = await this.userServiceRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
    });

    // Handle Discord OAuth2 flow
    if (service.name.toLowerCase() === 'discord' && code) {
      const tokens =
        await this.discordOAuth2Service.exchangeCodeForTokens(code);

      if (existing) {
        // Update existing user service with new tokens
        existing.oauth_token = tokens.accessToken;
        existing.refresh_token = tokens.refreshToken;
        existing.token_expires_at = tokens.expiresAt;
        await this.userServiceRepository.save(existing);
      } else {
        // Create new user service link with tokens
        const userService = this.userServiceRepository.create({
          user_id: userId,
          service_id: serviceId,
          oauth_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt,
        });
        await this.userServiceRepository.save(userService);
      }
    } else if (!existing) {
      throw new BadRequestException('Invalid request body');
    }
  }

  async unlinkService(userId: number, serviceId: number): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const result = await this.userServiceRepository.delete({
      user_id: userId,
      service_id: serviceId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `User service link not found for user ${userId} and service ${serviceId}`,
      );
    }
  }

  async refreshServiceToken(userId: number, serviceId: number): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    if (service.name.toLowerCase() !== 'discord') {
      throw new NotFoundException(
        `Service ${service.name} does not support token refresh`,
      );
    }

    const userService = await this.userServiceRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
    });

    if (!userService || !userService.refresh_token) {
      throw new NotFoundException(
        `User service link not found or no refresh token available`,
      );
    }

    const tokens = await this.discordOAuth2Service.refreshAccessToken(
      userService.refresh_token,
    );

    userService.oauth_token = tokens.accessToken;
    userService.refresh_token = tokens.refreshToken;
    userService.token_expires_at = tokens.expiresAt;
    await this.userServiceRepository.save(userService);
  }
}
