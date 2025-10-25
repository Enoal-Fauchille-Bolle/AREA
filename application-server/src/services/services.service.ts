import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ComponentsService } from '../components/components.service';
import { VariablesService } from '../variables/variables.service';
import { UserServicesService } from './user-services/user-services.service';
import { ConfigService } from '@nestjs/config';
import {
  ServiceActionsResponseDto,
  ServiceReactionsResponseDto,
  ServiceComponentsResponseDto,
  ServiceResponseDto,
  CreateServiceDto,
  LinkServiceDto,
} from './dto';
import { DiscordOAuth2Service } from './oauth2/discord-oauth2.service';
import { GoogleOAuth2Service } from './oauth2/google-oauth2.service';
import { GithubOAuth2Service } from './oauth2/github-oauth2.service';

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
    private readonly configService: ConfigService,
    private readonly discordOAuth2Service: DiscordOAuth2Service,
    private readonly googleOAuth2Service: GoogleOAuth2Service,
    private readonly githubOAuth2Service: GithubOAuth2Service,
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
    body?: LinkServiceDto,
  ): Promise<void> {

        const userService = this.userServiceRepository.create({
          user_id: userId,
          service_id: serviceId,
          oauth_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt,
        });
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

    await this.userServiceService.removeOne(userId, serviceId);
  }
}
