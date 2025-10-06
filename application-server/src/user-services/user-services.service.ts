import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './entities/user-service.entity';
import {
  CreateUserServiceDto,
  UpdateUserServiceDto,
  UserServiceResponseDto,
} from './dto';

@Injectable()
export class UserServicesService {
  constructor(
    @InjectRepository(UserService)
    private readonly userServiceRepository: Repository<UserService>,
  ) {}

  async create(
    createUserServiceDto: CreateUserServiceDto,
  ): Promise<UserServiceResponseDto> {
    // Check if user already has this service connected
    const existingConnection = await this.userServiceRepository.findOne({
      where: {
        user_id: createUserServiceDto.user_id,
        service_id: createUserServiceDto.service_id,
      },
    });

    if (existingConnection) {
      throw new ConflictException('User is already connected to this service');
    }

    const userService = this.userServiceRepository.create(createUserServiceDto);
    const savedUserService = await this.userServiceRepository.save(userService);
    return this.toResponseDto(savedUserService);
  }

  async findAll(): Promise<UserServiceResponseDto[]> {
    const userServices = await this.userServiceRepository.find({
      relations: ['user', 'service'],
      order: { created_at: 'DESC' },
    });
    return userServices.map((userService) => this.toResponseDto(userService));
  }

  async findOne(user_id: number): Promise<UserServiceResponseDto> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id },
      relations: ['user', 'service'],
    });

    if (!userService) {
      throw new NotFoundException(`UserService with ID ${user_id} not found`);
    }

    return this.toResponseDto(userService);
  }

  async findByUser(userId: number): Promise<UserServiceResponseDto[]> {
    const userServices = await this.userServiceRepository.find({
      where: { user_id: userId },
      relations: ['service'],
      order: { created_at: 'DESC' },
    });

    return userServices.map((userService) => this.toResponseDto(userService));
  }

  async findByService(serviceId: number): Promise<UserServiceResponseDto[]> {
    const userServices = await this.userServiceRepository.find({
      where: { service_id: serviceId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return userServices.map((userService) => this.toResponseDto(userService));
  }

  async findUserServiceConnection(
    userId: number,
    serviceId: number,
  ): Promise<UserServiceResponseDto | null> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
      relations: ['user', 'service'],
    });

    return userService ? this.toResponseDto(userService) : null;
  }

  async update(
    user_id: number,
    updateUserServiceDto: UpdateUserServiceDto,
  ): Promise<UserServiceResponseDto> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id },
      relations: ['user', 'service'],
    });

    if (!userService) {
      throw new NotFoundException(`UserService with ID ${user_id} not found`);
    }

    Object.assign(userService, updateUserServiceDto);
    const updatedUserService =
      await this.userServiceRepository.save(userService);
    return this.toResponseDto(updatedUserService);
  }

  async refreshToken(
    user_id: number,
    newToken: string,
    refreshToken?: string,
    expiresAt?: Date,
  ): Promise<UserServiceResponseDto> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id },
      relations: ['user', 'service'],
    });

    if (!userService) {
      throw new NotFoundException(`UserService with ID ${user_id} not found`);
    }

    userService.oauth_token = newToken;
    if (refreshToken) {
      userService.refresh_token = refreshToken;
    }
    if (expiresAt) {
      userService.token_expires_at = expiresAt;
    }

    const updatedUserService =
      await this.userServiceRepository.save(userService);
    return this.toResponseDto(updatedUserService);
  }

  async remove(user_id: number): Promise<void> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id },
    });
    if (!userService) {
      throw new NotFoundException(`UserService with ID ${user_id} not found`);
    }
    await this.userServiceRepository.remove(userService);
  }

  async removeUserServiceConnection(
    userId: number,
    serviceId: number,
  ): Promise<void> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
    });

    if (!userService) {
      throw new NotFoundException(
        `Connection between user ${userId} and service ${serviceId} not found`,
      );
    }

    await this.userServiceRepository.remove(userService);
  }

  private toResponseDto(userService: UserService): UserServiceResponseDto {
    const response: UserServiceResponseDto = {
      user_id: userService.user_id,
      service_id: userService.service_id,
      oauth_token: userService.oauth_token,
      refresh_token: userService.refresh_token,
      token_expires_at: userService.token_expires_at,
      created_at: userService.created_at,
      updated_at: userService.updated_at,
    };

    if (userService.user) {
      response.user = {
        id: userService.user.id,
        username: userService.user.username,
        email: userService.user.email,
      };
    }

    if (userService.service) {
      response.service = {
        id: userService.service.id,
        name: userService.service.name,
        description: userService.service.description ?? null,
      };
    }

    return response;
  }
}
