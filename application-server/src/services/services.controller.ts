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
  isMobileRequest,
  getOAuthProviderFromString,
} from '../oauth2';
import { parseIdParam } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
    if (isMobileRequest(userAgent)) {
      return handleMobileCallback(
        res,
        oauthProvider,
        code,
        'auth',
        this.configService,
      );
    }
    return 'Redirecting to mobile application...\n';
  }

  @Get()
  async findAll(): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMyServices(
    @Request() req: { user: { id: number } },
  ): Promise<ServiceResponseDto[]> {
    return this.servicesService.findUserServices(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.servicesService.findOne(parsedIntId);
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('discord/profile')
  async getDiscordProfile(
    @Request() req: { user: { id: number } },
  ): Promise<{ username: string; avatar: string | null; id: string }> {
    return this.servicesService.getDiscordProfile(req.user.id);
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('trello/auth-url')
  getTrelloAuthUrl(): { authUrl: string } {
    return this.servicesService.getTrelloAuthUrl();
  }

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
