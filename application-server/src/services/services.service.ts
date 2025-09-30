import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from './dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    const service = this.serviceRepository.create(createServiceDto);
    const savedService = await this.serviceRepository.save(service);
    return this.toResponseDto(savedService);
  }

  async findAll(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({});
    return services.map((service) => this.toResponseDto(service));
  }

  async findOne(id: number): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return this.toResponseDto(service);
  }

  async findByName(name: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { name } });
    if (!service) {
      throw new NotFoundException(`Service with name ${name} not found`);
    }
    return this.toResponseDto(service);
  }

  async findActive(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
    return services.map(service => this.toResponseDto(service));
  }

  async update(id: number, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    Object.assign(service, updateServiceDto);
    const updatedService = await this.serviceRepository.save(service);
    return this.toResponseDto(updatedService);
  }

  async remove(id: number): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    await this.serviceRepository.remove(service);
  }

  private toResponseDto(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      icon_path: service.icon_path,
      requires_auth: service.requires_auth,
      is_active: service.is_active,
      created_at: service.created_at,
    };
  }
}