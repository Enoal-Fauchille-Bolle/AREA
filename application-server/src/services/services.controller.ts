import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Request,
  Query,
  Res,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { type Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ServicesService } from './services.service';
import {
  ServiceResponseDto,
  ServiceActionsResponseDto,
  ServiceReactionsResponseDto,
  ServiceComponentsResponseDto,
  LinkServiceDto,
} from './dto';
import {
  handleMobileCallback,
  handleNonMobileRequest,
  isMobileRequest,
  getOAuthProviderFromString,
} from '../oauth2';
import { parseIdParam } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly configService: ConfigService,
  ) {}

  // Mobile OAuth2 Callback Endpoint (auto redirect)
  @Get('callback')
  oauth2Callback(
    @Headers('user-agent') userAgent: string,
    @Query('code') code: string,
    @Query('state') provider: string,
    @Res() res: Response,
  ) {
    if (!isMobileRequest(userAgent)) {
      return handleNonMobileRequest(res);
    }
    if (!code) {
      throw new BadRequestException('Missing OAuth code');
    }
    if (!provider) {
      throw new BadRequestException('Missing OAuth provider');
    }
    const oauthProvider = getOAuthProviderFromString(provider);
    if (!oauthProvider) {
      throw new BadRequestException('Invalid OAuth provider');
    }
    return handleMobileCallback(
      res,
      oauthProvider,
      code,
      'auth',
      this.configService,
    );
  }

  @ApiOperation({
    summary: 'Get all services',
    description: 'Retrieves all available services in the AREA platform',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all services',
    type: [ServiceResponseDto],
  })
  @Get()
  async findAll(): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAll();
  }

  @ApiOperation({
    summary: 'Get connected services',
    description: 'Retrieves all services connected by the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'List of connected services',
    type: [ServiceResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMyServices(
    @Request() req: { user: { id: number } },
  ): Promise<ServiceResponseDto[]> {
    return this.servicesService.findUserServices(req.user.id);
  }

  @ApiOperation({
    summary: 'Get service by ID',
    description: 'Retrieves detailed information about a specific service',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Service details',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.servicesService.findOne(parsedIntId);
  }

  @ApiOperation({
    summary: 'Get service actions',
    description:
      'Retrieves all action components available for a specific service',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of service actions',
    type: [ServiceActionsResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @Get(':id/actions')
  async findAllActions(
    @Param('id') id: string,
  ): Promise<ServiceActionsResponseDto[]> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.servicesService.findAllActions(parsedIntId);
  }

  @ApiOperation({
    summary: 'Get service reactions',
    description:
      'Retrieves all reaction components available for a specific service',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of service reactions',
    type: [ServiceReactionsResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @Get(':id/reactions')
  async findAllReactions(
    @Param('id') id: string,
  ): Promise<ServiceReactionsResponseDto[]> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.servicesService.findAllReactions(parsedIntId);
  }

  @ApiOperation({
    summary: 'Get all service components',
    description:
      'Retrieves all components (both actions and reactions) available for a specific service',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of all service components',
    type: [ServiceComponentsResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @Get(':id/components')
  async findAllComponents(
    @Param('id') id: string,
  ): Promise<ServiceComponentsResponseDto[]> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.servicesService.findAllComponents(parsedIntId);
  }

  @ApiOperation({
    summary: 'Link Trello service',
    description:
      'Links a Trello account to the authenticated user using an API token obtained from Trello',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: 'Trello account successfully linked',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Valid Trello token is required',
  })
  @UseGuards(JwtAuthGuard)
  @Post('trello/link')
  @HttpCode(HttpStatus.NO_CONTENT)
  async linkTrello(
    @Request() req: { user: { id: number } },
    @Body() body: { token?: string },
  ): Promise<void> {
    if (!body.token || typeof body.token !== 'string') {
      throw new BadRequestException('Valid Trello token is required');
    }
    await this.servicesService.linkTrello(req.user.id, body.token);
  }

  @ApiOperation({
    summary: 'Link service via OAuth2',
    description:
      'Links an OAuth2-based service (Google, GitHub, Discord, etc.) to the authenticated user using an authorization code',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Service successfully linked',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid service ID or OAuth parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':id/link')
  @HttpCode(HttpStatus.NO_CONTENT)
  async linkService(
    @Request() req: { user: { id: number } },
    @Param('id') id: string,
    @Body() body: LinkServiceDto,
  ): Promise<void> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    await this.servicesService.linkService(req.user.id, parsedIntId, body);
  }

  @ApiOperation({
    summary: 'Unlink service',
    description:
      'Removes the link between a service and the authenticated user',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Service successfully unlinked',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or not linked',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/unlink')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkService(
    @Request() req: { user: { id: number } },
    @Param('id') id: string,
  ): Promise<void> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    await this.servicesService.unlinkService(req.user.id, parsedIntId);
  }

  @ApiOperation({
    summary: 'Refresh service OAuth2 token',
    description:
      'Refreshes the OAuth2 access token for a connected service using its refresh token',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Service ID',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Token successfully refreshed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid service ID or refresh token unavailable',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or not connected',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':id/refresh-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async refreshToken(
    @Request() req: { user: { id: number } },
    @Param('id') id: string,
  ): Promise<void> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    await this.servicesService.refreshServiceToken(req.user.id, parsedIntId);
  }

  @ApiOperation({
    summary: 'Get Discord profile',
    description:
      'Retrieves the Discord profile information of the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Discord profile information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123456789012345678' },
        username: { type: 'string', example: 'johndoe' },
        avatar: {
          type: 'string',
          nullable: true,
          example: 'a1b2c3d4e5f6g7h8i9j0',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Discord account not linked',
  })
  @UseGuards(JwtAuthGuard)
  @Get('discord/profile')
  async getDiscordProfile(
    @Request() req: { user: { id: number } },
  ): Promise<{ username: string; avatar: string | null; id: string }> {
    return this.servicesService.getDiscordProfile(req.user.id);
  }

  @ApiOperation({
    summary: 'Get GitHub profile',
    description:
      'Retrieves the GitHub profile information of the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'GitHub profile information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '12345678' },
        login: { type: 'string', example: 'johndoe' },
        avatar_url: {
          type: 'string',
          nullable: true,
          example: 'https://avatars.githubusercontent.com/u/12345678',
        },
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'GitHub account not linked',
  })
  @UseGuards(JwtAuthGuard)
  @Get('github/profile')
  async getGitHubProfile(@Request() req: { user: { id: number } }): Promise<{
    id: string;
    login: string;
    avatar_url: string | null;
    email?: string;
  }> {
    return this.servicesService.getGitHubProfile(req.user.id);
  }

  @ApiOperation({
    summary: 'Get Twitch profile',
    description:
      'Retrieves the Twitch profile information of the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Twitch profile information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123456789' },
        login: { type: 'string', example: 'johndoe' },
        display_name: { type: 'string', example: 'JohnDoe' },
        profile_image_url: {
          type: 'string',
          nullable: true,
          example: 'https://static-cdn.jtvnw.net/user-default-pictures/...',
        },
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Twitch account not linked',
  })
  @UseGuards(JwtAuthGuard)
  @Get('twitch/profile')
  async getTwitchProfile(@Request() req: { user: { id: number } }): Promise<{
    id: string;
    login: string;
    display_name: string;
    profile_image_url: string | null;
    email?: string;
  }> {
    return this.servicesService.getTwitchProfile(req.user.id);
  }

  @ApiOperation({
    summary: 'Get Trello profile',
    description:
      'Retrieves the Trello profile information of the authenticated user',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Trello profile information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '5f8a9b3c1d2e3f4g5h6i7j8k' },
        username: { type: 'string', example: 'johndoe' },
        fullName: { type: 'string', example: 'John Doe' },
        avatarUrl: {
          type: 'string',
          nullable: true,
          example: 'https://trello-members.s3.amazonaws.com/...',
        },
        email: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Trello account not linked',
  })
  @UseGuards(JwtAuthGuard)
  @Get('trello/profile')
  async getTrelloProfile(@Request() req: { user: { id: number } }): Promise<{
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    email?: string;
  }> {
    return this.servicesService.getTrelloProfile(req.user.id);
  }

  @ApiOperation({
    summary: 'Get Trello authorization URL',
    description:
      'Returns the URL to redirect the user to for Trello authorization. User must visit this URL to obtain their Trello API token',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Trello authorization URL',
    schema: {
      type: 'object',
      properties: {
        authUrl: {
          type: 'string',
          example: 'https://trello.com/1/authorize?...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @UseGuards(JwtAuthGuard)
  @Get('trello/auth-url')
  getTrelloAuthUrl(): { authUrl: string } {
    return this.servicesService.getTrelloAuthUrl();
  }

  @ApiOperation({
    summary: 'Disconnect service by name',
    description:
      'Disconnects a service from the authenticated user using the service name',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'serviceName',
    description: 'Service name (e.g., "github", "discord", "trello")',
    type: 'string',
    example: 'github',
  })
  @ApiResponse({
    status: 204,
    description: 'Service successfully disconnected',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or not connected',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':serviceName/disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectService(
    @Request() req: { user: { id: number } },
    @Param('serviceName') serviceName: string,
  ): Promise<void> {
    await this.servicesService.disconnectService(req.user.id, serviceName);
  }
}
