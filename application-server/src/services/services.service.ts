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
} from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServicesService {
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
  ) {}

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

  async linkService(
    userId: number,
    serviceId: number,
    code?: string,
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
      throw new BadRequestException('Invalid request body');
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
}
