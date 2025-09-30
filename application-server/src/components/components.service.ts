import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Component, ComponentType } from './entities/component.entity';
import { CreateComponentDto, UpdateComponentDto, ComponentResponseDto } from './dto';

@Injectable()
export class ComponentsService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
  ) {}

  async create(createComponentDto: CreateComponentDto): Promise<ComponentResponseDto> {
    const component = this.componentRepository.create(createComponentDto);
    const savedComponent = await this.componentRepository.save(component);
    return this.toResponseDto(savedComponent);
  }

  async findAll(): Promise<ComponentResponseDto[]> {
    const components = await this.componentRepository.find({
      relations: ['service'],
      order: { created_at: 'DESC' },
    });
    return components.map(component => this.toResponseDto(component));
  }

  async findOne(id: number): Promise<ComponentResponseDto> {
    const component = await this.componentRepository.findOne({
      where: { id },
      relations: ['service'],
    });
    
    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }
    
    return this.toResponseDto(component);
  }

  async findByService(serviceId: number): Promise<ComponentResponseDto[]> {
    const components = await this.componentRepository.find({
      where: { service_id: serviceId },
      relations: ['service'],
      order: { name: 'ASC' },
    });
    
    return components.map(component => this.toResponseDto(component));
  }

  async findByType(type: ComponentType): Promise<ComponentResponseDto[]> {
    const components = await this.componentRepository.find({
      where: { type },
      relations: ['service'],
      order: { name: 'ASC' },
    });
    
    return components.map(component => this.toResponseDto(component));
  }

  async findByServiceAndType(serviceId: number, type: ComponentType): Promise<ComponentResponseDto[]> {
    const components = await this.componentRepository.find({
      where: { service_id: serviceId, type },
      relations: ['service'],
      order: { name: 'ASC' },
    });
    
    return components.map(component => this.toResponseDto(component));
  }

  async findActive(): Promise<ComponentResponseDto[]> {
    const components = await this.componentRepository.find({
      where: { is_active: true },
      relations: ['service'],
      order: { name: 'ASC' },
    });
    
    return components.map(component => this.toResponseDto(component));
  }

  async findActions(): Promise<ComponentResponseDto[]> {
    return this.findByType(ComponentType.ACTION);
  }

  async findReactions(): Promise<ComponentResponseDto[]> {
    return this.findByType(ComponentType.REACTION);
  }

  async update(id: number, updateComponentDto: UpdateComponentDto): Promise<ComponentResponseDto> {
    const component = await this.componentRepository.findOne({
      where: { id },
      relations: ['service'],
    });
    
    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }

    Object.assign(component, updateComponentDto);
    const updatedComponent = await this.componentRepository.save(component);
    return this.toResponseDto(updatedComponent);
  }

  async remove(id: number): Promise<void> {
    const component = await this.componentRepository.findOne({ where: { id } });
    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }
    await this.componentRepository.remove(component);
  }

  private toResponseDto(component: Component): ComponentResponseDto {
    const response: ComponentResponseDto = {
      id: component.id,
      service_id: component.service_id,
      type: component.type,
      name: component.name,
      description: component.description,
      is_active: component.is_active,
      webhook_endpoint: component.webhook_endpoint,
      polling_interval: component.polling_interval,
      created_at: component.created_at,
      updated_at: component.updated_at,
    };

    if (component.service) {
      response.service = {
        id: component.service.id,
        name: component.service.name,
        description: component.service.description,
      };
    }

    return response;
  }
}