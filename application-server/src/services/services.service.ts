import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    const service = this.serviceRepository.create(createServiceDto);
    const savedService = await this.serviceRepository.save(service);
    return ServiceResponseDto.fromEntity(savedService, this.configService);
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
    const service = await this.serviceRepository.findOne({ where: { name } });
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

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    Object.assign(service, updateServiceDto);
    const updatedService = await this.serviceRepository.save(service);
    return ServiceResponseDto.fromEntity(updatedService, this.configService);
  }

  async remove(id: number): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    await this.serviceRepository.remove(service);
  }
}
