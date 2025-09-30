import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaParameter } from './entities/area-parameter.entity';
import { CreateAreaParameterDto, UpdateAreaParameterDto, AreaParameterResponseDto } from './dto';

@Injectable()
export class AreaParametersService {
  constructor(
    @InjectRepository(AreaParameter)
    private readonly areaParameterRepository: Repository<AreaParameter>,
  ) {}

  async create(createAreaParameterDto: CreateAreaParameterDto): Promise<AreaParameterResponseDto> {
    // Check if this area-variable combination already exists
    const existingParameter = await this.areaParameterRepository.findOne({
      where: {
        area_id: createAreaParameterDto.area_id,
        variable_id: createAreaParameterDto.variable_id,
      },
    });

    if (existingParameter) {
      throw new ConflictException('Parameter for this area and variable combination already exists');
    }

    const areaParameter = this.areaParameterRepository.create(createAreaParameterDto);
    const savedAreaParameter = await this.areaParameterRepository.save(areaParameter);
    return this.toResponseDto(savedAreaParameter);
  }

  async findAll(): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      relations: ['variable'],
      order: { area_id: 'ASC', variable_id: 'ASC' },
    });
    return areaParameters.map(param => this.toResponseDto(param));
  }

  async findByArea(areaId: number): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { area_id: areaId },
      relations: ['variable'],
      order: { variable_id: 'ASC' },
    });
    
    return areaParameters.map(param => this.toResponseDto(param));
  }

  async findByVariable(variableId: number): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { variable_id: variableId },
      relations: ['variable'],
      order: { area_id: 'ASC' },
    });
    
    return areaParameters.map(param => this.toResponseDto(param));
  }

  async findOne(areaId: number, variableId: number): Promise<AreaParameterResponseDto> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
      relations: ['variable'],
    });
    
    if (!areaParameter) {
      throw new NotFoundException(`AreaParameter for area ${areaId} and variable ${variableId} not found`);
    }
    
    return this.toResponseDto(areaParameter);
  }

  async findTemplates(): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { is_template: true },
      relations: ['variable'],
      order: { area_id: 'ASC', variable_id: 'ASC' },
    });
    
    return areaParameters.map(param => this.toResponseDto(param));
  }

  async findTemplatesByArea(areaId: number): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { area_id: areaId, is_template: true },
      relations: ['variable'],
      order: { variable_id: 'ASC' },
    });
    
    return areaParameters.map(param => this.toResponseDto(param));
  }

  async update(
    areaId: number, 
    variableId: number, 
    updateAreaParameterDto: UpdateAreaParameterDto
  ): Promise<AreaParameterResponseDto> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
      relations: ['variable'],
    });
    
    if (!areaParameter) {
      throw new NotFoundException(`AreaParameter for area ${areaId} and variable ${variableId} not found`);
    }

    Object.assign(areaParameter, updateAreaParameterDto);
    const updatedAreaParameter = await this.areaParameterRepository.save(areaParameter);
    return this.toResponseDto(updatedAreaParameter);
  }

  async updateValue(areaId: number, variableId: number, value: string): Promise<AreaParameterResponseDto> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
      relations: ['variable'],
    });
    
    if (!areaParameter) {
      throw new NotFoundException(`AreaParameter for area ${areaId} and variable ${variableId} not found`);
    }

    areaParameter.value = value;
    const updatedAreaParameter = await this.areaParameterRepository.save(areaParameter);
    return this.toResponseDto(updatedAreaParameter);
  }

  async bulkCreateOrUpdate(areaId: number, parameters: { variable_id: number; value: string; is_template?: boolean }[]): Promise<AreaParameterResponseDto[]> {
    const results: AreaParameterResponseDto[] = [];

    for (const param of parameters) {
      const existing = await this.areaParameterRepository.findOne({
        where: { area_id: areaId, variable_id: param.variable_id },
        relations: ['variable'],
      });

      if (existing) {
        existing.value = param.value;
        if (param.is_template !== undefined) {
          existing.is_template = param.is_template;
        }
        const updated = await this.areaParameterRepository.save(existing);
        results.push(this.toResponseDto(updated));
      } else {
        const newParam = this.areaParameterRepository.create({
          area_id: areaId,
          variable_id: param.variable_id,
          value: param.value,
          is_template: param.is_template || false,
        });
        const saved = await this.areaParameterRepository.save(newParam);
        const withRelations = await this.areaParameterRepository.findOne({
          where: { area_id: areaId, variable_id: param.variable_id },
          relations: ['variable'],
        });
        results.push(this.toResponseDto(withRelations!));
      }
    }

    return results;
  }

  async remove(areaId: number, variableId: number): Promise<void> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
    });
    
    if (!areaParameter) {
      throw new NotFoundException(`AreaParameter for area ${areaId} and variable ${variableId} not found`);
    }
    
    await this.areaParameterRepository.remove(areaParameter);
  }

  async removeByArea(areaId: number): Promise<void> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { area_id: areaId },
    });
    
    if (areaParameters.length > 0) {
      await this.areaParameterRepository.remove(areaParameters);
    }
  }

  async removeByVariable(variableId: number): Promise<void> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { variable_id: variableId },
    });
    
    if (areaParameters.length > 0) {
      await this.areaParameterRepository.remove(areaParameters);
    }
  }

  private toResponseDto(areaParameter: AreaParameter): AreaParameterResponseDto {
    const response: AreaParameterResponseDto = {
      area_id: areaParameter.area_id,
      variable_id: areaParameter.variable_id,
      value: areaParameter.value,
      is_template: areaParameter.is_template,
      created_at: areaParameter.created_at,
      updated_at: areaParameter.updated_at,
    };

    if (areaParameter.variable) {
      response.variable = {
        id: areaParameter.variable.id,
        name: areaParameter.variable.name,
        kind: areaParameter.variable.kind,
        type: areaParameter.variable.type || '',
      };
    }

    return response;
  }
}