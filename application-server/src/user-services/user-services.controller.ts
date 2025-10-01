import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { UserServicesService } from './user-services.service';
import {
  CreateUserServiceDto,
  UpdateUserServiceDto,
  UserServiceResponseDto,
} from './dto';

@Controller('user-services')
export class UserServicesController {
  constructor(private readonly userServicesService: UserServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createUserServiceDto: CreateUserServiceDto,
  ): Promise<UserServiceResponseDto> {
    return this.userServicesService.create(createUserServiceDto);
  }

  @Get()
  findAll(): Promise<UserServiceResponseDto[]> {
    return this.userServicesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserServiceResponseDto> {
    return this.userServicesService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserServiceResponseDto[]> {
    return this.userServicesService.findByUser(userId);
  }

  @Get('service/:serviceId')
  findByService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<UserServiceResponseDto[]> {
    return this.userServicesService.findByService(serviceId);
  }

  @Get('connection/:userId/:serviceId')
  findUserServiceConnection(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<UserServiceResponseDto | null> {
    return this.userServicesService.findUserServiceConnection(
      userId,
      serviceId,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserServiceDto: UpdateUserServiceDto,
  ): Promise<UserServiceResponseDto> {
    return this.userServicesService.update(id, updateUserServiceDto);
  }

  @Patch(':id/refresh-token')
  refreshToken(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      oauth_token: string;
      refresh_token?: string;
      token_expires_at?: string;
    },
  ): Promise<UserServiceResponseDto> {
    const expiresAt = body.token_expires_at
      ? new Date(body.token_expires_at)
      : undefined;
    return this.userServicesService.refreshToken(
      id,
      body.oauth_token,
      body.refresh_token,
      expiresAt,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userServicesService.remove(id);
  }

  @Delete('connection/:userId/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUserServiceConnection(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ): Promise<void> {
    return this.userServicesService.removeUserServiceConnection(
      userId,
      serviceId,
    );
  }
}
