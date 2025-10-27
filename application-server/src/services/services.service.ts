import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ComponentsService } from '../components/components.service';
import { VariablesService } from '../variables/variables.service';
import { UserServicesService } from './user-services/user-services.service';
import { OAuth2Service } from '../oauth2/oauth2.service';
import { ConfigService } from '@nestjs/config';
import {
  ServiceActionsResponseDto,
  ServiceReactionsResponseDto,
  ServiceComponentsResponseDto,
  ServiceResponseDto,
  CreateServiceDto,
  LinkServiceDto,
  LinkPlatform,
} from './dto';
import { getOAuthProviderFromString } from '../oauth2/dto';

@Injectable()
export class ServicesService {
  private readonly webRedirectUri: string;
  private readonly mobileRedirectUri: string;

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly componentService: ComponentsService,
    private readonly variableService: VariablesService,
    private readonly userServiceService: UserServicesService,
    private readonly oauth2Service: OAuth2Service,
    private readonly configService: ConfigService,
  ) {
    const appConfig = this.configService.get('app');
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

    const components = await this.componentService.findActions();
    const filteredComponents = components.filter(
      (component) => component.service_id === id,
    );

    const result: ServiceActionsResponseDto[] = [];

    for (const component of filteredComponents) {
      const variables = await this.variableService.findByComponent(
        component.id,
      );

      result.push(
        ServiceActionsResponseDto.fromResponseDto(component, variables),
      );
    }

    return result;
  }

  async findAllReactions(id: number): Promise<ServiceReactionsResponseDto[]> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const components = await this.componentService.findReactions();
    const filteredComponents = components.filter(
      (component) => component.service_id === id,
    );

    const result: ServiceReactionsResponseDto[] = [];

    for (const component of filteredComponents) {
      const variables = await this.variableService.findByComponent(
        component.id,
      );

      result.push(
        ServiceReactionsResponseDto.fromResponseDto(component, variables),
      );
    }

    return result;
  }

  async findAllComponents(id: number): Promise<ServiceComponentsResponseDto[]> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const components = await this.componentService.findByService(id);

    const result: ServiceComponentsResponseDto[] = [];

    for (const component of components) {
      const variables = await this.variableService.findByComponent(
        component.id,
      );

      result.push(
        ServiceComponentsResponseDto.fromResponseDto(component, variables),
      );
    }

    return result;
  }

  async findUserServices(userId: number): Promise<ServiceResponseDto[]> {
    const userServices = await this.userServiceService.findByUser(userId);

    return await Promise.all(
      userServices.map(async (us) => {
        const service = await this.serviceRepository.findOne({
          where: { id: us.service.id },
        });
        if (!service) {
          throw new NotFoundException(
            `Service with ID ${us.service.id} not found`,
          );
        }
        return ServiceResponseDto.fromEntity(service, this.configService);
      }),
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
    body: LinkServiceDto,
  ): Promise<void> {
    const userService = await this.userServiceService.findOne(
      userId,
      serviceId,
    );

    if (userService) {
      if (!userService.service.require_auth) {
        return;
      }
      if (userService.refresh_token) {
        const provider = getOAuthProviderFromString(userService.service.name);
        // Unreachable code check
        if (!provider) {
          throw new InternalServerErrorException(
            `OAuth provider for service "${userService.service.name}" should exist`,
          );
        }
        const tokens = await this.oauth2Service.refreshAccessToken({
          provider: provider,
          refresh_token: userService.refresh_token,
        });
        await this.userServiceService.update({
          user_id: userId,
          service_id: serviceId,
          oauth_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000)
            : undefined,
        });
        return;
      }
    }

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    if (!service.requires_auth) {
      await this.userServiceService.create({
        user_id: userId,
        service_id: serviceId,
      });
      return;
    }

    if (!body.code || !body.platform) {
      throw new BadRequestException(
        'Authorization code and platform are required to link this service',
      );
    }

    const redirectUri =
      body.platform === LinkPlatform.WEB
        ? this.webRedirectUri
        : this.mobileRedirectUri;

    const provider = getOAuthProviderFromString(service.name);
    if (!provider) {
      throw new BadRequestException(
        `Cannot link service "${service.name}". The service may not be implemented or is not supported for linking.`,
      );
    }

    const tokens = await this.oauth2Service.exchangeCodeForTokens({
      code: body.code,
      provider: provider,
      redirect_uri: redirectUri,
    });

    if (userService) {
      await this.userServiceService.update({
        user_id: userId,
        service_id: serviceId,
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
      });
    } else {
      await this.userServiceService.create({
        user_id: userId,
        service_id: serviceId,
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
      });
    }
  }

  async unlinkService(userId: number, serviceId: number): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    await this.userServiceService.removeOne(userId, serviceId);
  }
}
