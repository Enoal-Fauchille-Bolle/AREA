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
  CreateServiceDto,
} from './dto';
import { ConfigService } from '@nestjs/config';
import { DiscordOAuth2Service } from './oauth2/discord-oauth2.service';
import { GithubOAuth2Service } from './oauth2/github-oauth2.service';
import { AppConfig } from 'src/config';

@Injectable()
export class ServicesService {
  private readonly webRedirectUri: string;
  private readonly mobileRedirectUri: string;

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
    private readonly githubOAuth2Service: GithubOAuth2Service,
  ) {
    const appConfig = this.configService.get<AppConfig>('app');
    if (!appConfig) {
      // Unreachable
      throw new Error('App configuration is not properly loaded');
    }
    this.webRedirectUri = appConfig.oauth2.service.web_redirect_uri;
    this.mobileRedirectUri = appConfig.oauth2.service.mobile_redirect_uri;
  }

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

  async findByName(name: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { name: name },
    });
    if (!service) {
      throw new NotFoundException(`Service with name ${name} not found`);
    }
    return ServiceResponseDto.fromEntity(service, this.configService);
  }

  async findActive(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });

    return services.map((service) =>
      ServiceResponseDto.fromEntity(service, this.configService),
    );
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

  async create(
    createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    const service = this.serviceRepository.create(createServiceDto);
    const savedService = await this.serviceRepository.save(service);
    return ServiceResponseDto.fromEntity(savedService, this.configService);
  }

  async linkService(
    userId: number,
    serviceId: number,
    body: { code: string; code_verifier?: string; platform: 'web' | 'mobile' },
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

    const redirectUri =
      body.platform === 'web' ? this.webRedirectUri : this.mobileRedirectUri;

    // Handle Discord OAuth2 flow
    if (service.name.toLowerCase() === 'discord') {
      const tokens = await this.discordOAuth2Service.exchangeCodeForTokens(
        body.code,
        redirectUri,
        body.code_verifier,
      );

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
    } else if (service.name.toLowerCase() === 'github') {
      const tokens = await this.githubOAuth2Service.exchangeCodeForTokens(
        body.code,
        redirectUri,
      );

      if (existing) {
        // Update existing user service with new tokens
        existing.oauth_token = tokens.accessToken;
        await this.userServiceRepository.save(existing);
      } else {
        // Create new user service link with tokens
        const userService = this.userServiceRepository.create({
          user_id: userId,
          service_id: serviceId,
          oauth_token: tokens.accessToken,
        });
        await this.userServiceRepository.save(userService);
      }
    } else if (!existing) {
      throw new BadRequestException(
        `Cannot link service "${service.name}". The service may not be implemented or is not supported for linking.`,
      );
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
