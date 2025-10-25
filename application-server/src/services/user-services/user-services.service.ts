import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './entities/user-service.entity';
import { Service } from '../entities/service.entity';
import {
  CreateUserServiceDto,
  UpdateUserServiceDto,
  UserServiceResponseDto,
} from './dto';
import { UsersService } from '../../users/users.service';

@Injectable()
export class UserServicesService {
  constructor(
    @InjectRepository(UserService)
    private readonly userServiceRepository: Repository<UserService>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly usersService: UsersService,
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

    const user = await this.usersService.findOne(createUserServiceDto.user_id);
    const service = await this.serviceRepository.findOne({
      where: { id: createUserServiceDto.service_id },
    });

    if (!user || !service) {
      throw new NotFoundException(
        'User or Service not found for the provided IDs',
      );
    }

    if (service.requires_auth && !createUserServiceDto.oauth_token) {
      throw new ConflictException(
        'OAuth token is required for services that require authentication',
      );
    }

    const userService = this.userServiceRepository.create({
      user_id: createUserServiceDto.user_id,
      service_id: createUserServiceDto.service_id,
      oauth_token: createUserServiceDto.oauth_token ?? null,
      refresh_token: createUserServiceDto.refresh_token ?? null,
      token_expires_at: createUserServiceDto.token_expires_at ?? null,
    });
    const savedUserService = await this.userServiceRepository.save(userService);
    return UserServiceResponseDto.fromEntity(savedUserService);
  }

  async findAll(): Promise<UserServiceResponseDto[]> {
    const userServices = await this.userServiceRepository.find({
      relations: ['user', 'service'],
      order: { created_at: 'DESC' },
    });
    return userServices.map((userService) =>
      UserServiceResponseDto.fromEntity(userService),
    );
  }

  async findOne(
    userId: number,
    serviceId: number,
  ): Promise<UserServiceResponseDto | null> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
      relations: ['user', 'service'],
    });

    return userService ? UserServiceResponseDto.fromEntity(userService) : null;
  }

  async findByUser(userId: number): Promise<UserServiceResponseDto[]> {
    const userServices = await this.userServiceRepository.find({
      where: { user_id: userId },
      relations: ['user', 'service'],
      order: { created_at: 'DESC' },
    });

    return userServices.map((userService) =>
      UserServiceResponseDto.fromEntity(userService),
    );
  }

  async findByService(serviceId: number): Promise<UserServiceResponseDto[]> {
    const userServices = await this.userServiceRepository.find({
      where: { service_id: serviceId },
      relations: ['user', 'service'],
      order: { created_at: 'DESC' },
    });

    return userServices.map((userService) =>
      UserServiceResponseDto.fromEntity(userService),
    );
  }

  async update(
    updateUserServiceDto: UpdateUserServiceDto,
  ): Promise<UserServiceResponseDto> {
    const userService = await this.userServiceRepository.findOne({
      where: {
        user_id: updateUserServiceDto.user_id,
        service_id: updateUserServiceDto.service_id,
      },
      relations: ['user', 'service'],
    });

    if (!userService) {
      throw new NotFoundException(
        `Service ${updateUserServiceDto.service_id} for User ${updateUserServiceDto.user_id} not found`,
      );
    }

    if (
      userService.service.requires_auth &&
      !updateUserServiceDto.oauth_token
    ) {
      throw new ConflictException(
        'OAuth token is required for services that require authentication',
      );
    }

    const updatedUserService = await this.userServiceRepository.save({
      ...userService,
      ...updateUserServiceDto,
    });
    return UserServiceResponseDto.fromEntity(updatedUserService);
  }

  async removeOne(user_id: number, service_id: number): Promise<void> {
    const userService = await this.userServiceRepository.findOne({
      where: { user_id, service_id },
    });
    if (!userService) {
      throw new NotFoundException(`UserService not found`);
    }
    await this.userServiceRepository.remove(userService);
  }

  async removeForUser(user_id: number): Promise<void> {
    const userServices = await this.userServiceRepository.find({
      where: { user_id },
    });
    await this.userServiceRepository.remove(userServices);
  }
}
