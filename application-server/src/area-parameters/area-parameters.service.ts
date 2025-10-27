import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaParameter } from './entities/area-parameter.entity';
import {
  CreateAreaParameterDto,
  UpdateAreaParameterDto,
  AreaParameterResponseDto,
} from './dto';

@Injectable()
export class AreaParametersService {
  constructor(
    @InjectRepository(AreaParameter)
    private readonly areaParameterRepository: Repository<AreaParameter>,
  ) {}

  async create(
    createAreaParameterDto: CreateAreaParameterDto,
  ): Promise<AreaParameterResponseDto> {
    // Check if this area-variable combination already exists
    const existingParameter = await this.areaParameterRepository.findOne({
      where: {
        area_id: createAreaParameterDto.area_id,
        variable_id: createAreaParameterDto.variable_id,
      },
    });

    if (existingParameter) {
      throw new ConflictException(
        'Parameter for this area and variable combination already exists',
      );
    }

    const areaParameter = this.areaParameterRepository.create(
      createAreaParameterDto,
    );
    const savedAreaParameter =
      await this.areaParameterRepository.save(areaParameter);
    return this.toResponseDto(savedAreaParameter);
  }

  async findAll(): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      relations: ['variable'],
      order: { area_id: 'ASC', variable_id: 'ASC' },
    });
    return areaParameters.map((param) => this.toResponseDto(param));
  }

  async findByArea(areaId: number): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { area_id: areaId },
      relations: ['variable'],
      order: { variable_id: 'ASC' },
    });

    return areaParameters.map((param) => this.toResponseDto(param));
  }

  async findByVariable(
    variableId: number,
  ): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { variable_id: variableId },
      relations: ['variable'],
      order: { area_id: 'ASC' },
    });

    return areaParameters.map((param) => this.toResponseDto(param));
  }

  async findOne(
    areaId: number,
    variableId: number,
  ): Promise<AreaParameterResponseDto> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
      relations: ['variable'],
    });

    if (!areaParameter) {
      throw new NotFoundException(
        `AreaParameter for area ${areaId} and variable ${variableId} not found`,
      );
    }

    return this.toResponseDto(areaParameter);
  }

  async findTemplates(): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      relations: ['variable'],
      order: { area_id: 'ASC', variable_id: 'ASC' },
    });

    return areaParameters.map((param) => this.toResponseDto(param));
  }

  async findTemplatesByArea(
    areaId: number,
  ): Promise<AreaParameterResponseDto[]> {
    const areaParameters = await this.areaParameterRepository.find({
      where: { area_id: areaId },
      relations: ['variable'],
      order: { variable_id: 'ASC' },
    });

    return areaParameters.map((param) => this.toResponseDto(param));
  }

  async update(
    areaId: number,
    variableId: number,
    updateAreaParameterDto: UpdateAreaParameterDto,
  ): Promise<AreaParameterResponseDto> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
      relations: ['variable'],
    });

    if (!areaParameter) {
      throw new NotFoundException(
        `AreaParameter for area ${areaId} and variable ${variableId} not found`,
      );
    }

    Object.assign(areaParameter, updateAreaParameterDto);
    const updatedAreaParameter =
      await this.areaParameterRepository.save(areaParameter);
    return this.toResponseDto(updatedAreaParameter);
  }

  async updateValue(
    areaId: number,
    variableId: number,
    value: string,
  ): Promise<AreaParameterResponseDto> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
      relations: ['variable'],
    });

    if (!areaParameter) {
      throw new NotFoundException(
        `AreaParameter for area ${areaId} and variable ${variableId} not found`,
      );
    }

    areaParameter.value = value;
    const updatedAreaParameter =
      await this.areaParameterRepository.save(areaParameter);
    return this.toResponseDto(updatedAreaParameter);
  }

  async bulkCreateOrUpdate(
    areaId: number,
    parameters: { variable_id: number; value: string; is_template?: boolean }[],
  ): Promise<AreaParameterResponseDto[]> {
    // Prepare entities for upsert
    const entities = parameters.map((param) => ({
      area_id: areaId,
      variable_id: param.variable_id,
      value: param.value,
      is_template: param.is_template ?? false,
    }));
    // Perform upsert (insert or update) in a single batch operation
    await this.areaParameterRepository.upsert(entities, [
      'area_id',
      'variable_id',
    ]);
    // Fetch all affected records with relations in a single query
    const variableIds = parameters.map((param) => param.variable_id);
    const updatedParams = await this.areaParameterRepository.find({
      where: variableIds.map((variable_id) => ({
        area_id: areaId,
        variable_id,
      })),
      relations: ['variable'],
    });
    return updatedParams.map((param) => this.toResponseDto(param));
  }

  async remove(areaId: number, variableId: number): Promise<void> {
    const areaParameter = await this.areaParameterRepository.findOne({
      where: { area_id: areaId, variable_id: variableId },
    });

    if (!areaParameter) {
      throw new NotFoundException(
        `AreaParameter for area ${areaId} and variable ${variableId} not found`,
      );
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

  private toResponseDto(
    areaParameter: AreaParameter,
  ): AreaParameterResponseDto {
    const response: AreaParameterResponseDto = {
      area_id: areaParameter.area_id,
      variable_id: areaParameter.variable_id,
      value: areaParameter.value,
    };

    if (areaParameter.variable) {
      response.variable = {
        id: areaParameter.variable.id,
        component_id: areaParameter.variable.component_id,
        name: areaParameter.variable.name,
        description: areaParameter.variable.description,
        kind: areaParameter.variable.kind,
        type: areaParameter.variable.type,
        nullable: areaParameter.variable.nullable,
        placeholder: areaParameter.variable.placeholder,
        validation_regex: areaParameter.variable.validation_regex,
        display_order: areaParameter.variable.display_order,
      };
    }

    return response;
  }
}
