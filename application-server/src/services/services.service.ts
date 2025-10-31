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

  async getDiscordProfile(
    userId: number,
  ): Promise<{ username: string; avatar: string | null; id: string }> {
    // Find Discord service
    const discordService = await this.serviceRepository.findOne({
      where: { name: 'Discord' },
    });
    if (!discordService) {
      throw new NotFoundException('Discord service not found');
    }

    // Find user's Discord connection
    const userService = await this.userServiceService.findOne(
      userId,
      discordService.id,
    );

    if (!userService || !userService.oauth_token) {
      throw new NotFoundException('Discord account not connected');
    }

    try {
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${userService.oauth_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Discord profile');
      }

      const profile = (await response.json()) as {
        id: string;
        username: string;
        avatar: string | null;
      };
      return {
        username: profile.username,
        avatar: profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null,
        id: profile.id,
      };
    } catch {
      throw new BadRequestException('Failed to retrieve Discord profile');
    }
  }

  async getGitHubProfile(userId: number): Promise<{
    id: string;
    login: string;
    avatar_url: string | null;
    email?: string;
  }> {
    const githubService = await this.serviceRepository.findOne({
      where: { name: 'GitHub' },
    });
    if (!githubService) {
      throw new NotFoundException('GitHub service not found');
    }

    const userService = await this.userServiceService.findOne(
      userId,
      githubService.id,
    );

    if (!userService || !userService.oauth_token) {
      throw new NotFoundException('GitHub account not connected');
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${userService.oauth_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub profile');
      }

      const profile = (await response.json()) as {
        id: number;
        login: string;
        avatar_url: string | null;
        email?: string;
      };

      return {
        id: profile.id.toString(),
        login: profile.login,
        avatar_url: profile.avatar_url,
        email: profile.email,
      };
    } catch {
      throw new BadRequestException('Failed to retrieve GitHub profile');
    }
  }

  async getTwitchProfile(userId: number): Promise<{
    id: string;
    login: string;
    display_name: string;
    profile_image_url: string | null;
    email?: string;
  }> {
    const twitchService = await this.serviceRepository.findOne({
      where: { name: 'Twitch' },
    });
    if (!twitchService) {
      throw new NotFoundException('Twitch service not found');
    }

    const userService = await this.userServiceService.findOne(
      userId,
      twitchService.id,
    );

    if (!userService || !userService.oauth_token) {
      throw new NotFoundException('Twitch account not connected');
    }

    try {
      const appConfig = this.configService.get('app');
      const clientId = appConfig.oauth2.twitch?.clientId;

      if (!clientId) {
        throw new Error('Twitch client ID not configured');
      }

      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          Authorization: `Bearer ${userService.oauth_token}`,
          'Client-Id': clientId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Twitch profile');
      }

      const data = (await response.json()) as {
        data: Array<{
          id: string;
          login: string;
          display_name: string;
          profile_image_url: string;
          email?: string;
        }>;
      };

      if (!data.data || data.data.length === 0) {
        throw new Error('No Twitch user data returned');
      }

      const profile = data.data[0];

      return {
        id: profile.id,
        login: profile.login,
        display_name: profile.display_name,
        profile_image_url: profile.profile_image_url,
        email: profile.email,
      };
    } catch (error) {
      console.error('Failed to retrieve Twitch profile:', error);
      throw new BadRequestException('Failed to retrieve Twitch profile');
    }
  }

  async getTrelloProfile(userId: number): Promise<{
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    email?: string;
  }> {
    const trelloService = await this.serviceRepository.findOne({
      where: { name: 'Trello' },
    });
    if (!trelloService) {
      throw new NotFoundException('Trello service not found');
    }

    const userService = await this.userServiceService.findOne(
      userId,
      trelloService.id,
    );

    if (!userService || !userService.oauth_token) {
      throw new NotFoundException('Trello account not connected');
    }

    try {
      const appConfig = this.configService.get('app');
      const apiKey = appConfig.oauth2.trello?.apiKey;

      if (!apiKey) {
        throw new Error('Trello API key not configured');
      }

      const response = await fetch(
        `https://api.trello.com/1/members/me?key=${apiKey}&token=${userService.oauth_token}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Trello profile');
      }

      const profile = (await response.json()) as {
        id: string;
        username: string;
        fullName: string;
        avatarUrl: string | null;
        email?: string;
      };

      return {
        id: profile.id,
        username: profile.username,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        email: profile.email,
      };
    } catch (error) {
      console.error('Failed to retrieve Trello profile:', error);
      throw new BadRequestException('Failed to retrieve Trello profile');
    }
  }

  getTrelloAuthUrl(): { authUrl: string } {
    const appConfig = this.configService.get('app');
    const apiKey = appConfig.oauth2.trello?.apiKey;

    if (!apiKey) {
      throw new InternalServerErrorException('Trello API key not configured');
    }

    const appName = 'AREA';
    const scope = 'read,write';
    const expiration = 'never';
    const returnUrl = `${appConfig.serverUrl}/services/trello/callback`;

    // Trello OAuth 1.0a authorization URL
    const authUrl = `https://trello.com/1/authorize?expiration=${expiration}&name=${encodeURIComponent(appName)}&scope=${scope}&response_type=token&key=${apiKey}&return_url=${encodeURIComponent(returnUrl)}`;

    return { authUrl };
  }

  async disconnectService(userId: number, serviceName: string): Promise<void> {
    let normalizedName = serviceName;
    if (serviceName.toLowerCase() === 'github') {
      normalizedName = 'GitHub';
    } else {
      normalizedName =
        serviceName.charAt(0).toUpperCase() +
        serviceName.slice(1).toLowerCase();
    }

    const service = await this.serviceRepository.findOne({
      where: { name: normalizedName },
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceName} not found`);
    }

    await this.userServiceService.removeOne(userId, service.id);
  }

  async refreshServiceToken(userId: number, serviceId: number): Promise<void> {
    const userService = await this.userServiceService.findOne(
      userId,
      serviceId,
    );

    if (!userService) {
      throw new NotFoundException(
        `User service connection not found for user ${userId} and service ${serviceId}`,
      );
    }

    if (!userService.refresh_token) {
      throw new BadRequestException(
        'No refresh token available for this service connection',
      );
    }

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const provider = getOAuthProviderFromString(service.name);
    if (!provider) {
      throw new BadRequestException(
        `Cannot refresh token for service "${service.name}". The service may not be implemented or is not supported.`,
      );
    }

    try {
      const tokens = await this.oauth2Service.refreshAccessToken({
        provider: provider,
        refresh_token: userService.refresh_token,
      });

      await this.userServiceService.update({
        user_id: userId,
        service_id: serviceId,
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? userService.refresh_token,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to refresh token for service "${service.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
