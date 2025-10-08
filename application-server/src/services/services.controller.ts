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
} from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  ServiceResponseDto,
  ServiceActionsResponseDto,
  ServiceReactionsResponseDto,
  ServiceComponentsResponseDto,
} from './dto';
import { parseIdParam } from '../common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

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
    @Body() body: { code?: string },
  ): Promise<void> {
    const parsedIntId = parseIdParam(id);
    if (isNaN(parsedIntId)) {
      throw new BadRequestException('Invalid ID format');
    }
    await this.servicesService.linkService(req.user.id, parsedIntId, body.code);
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
}
