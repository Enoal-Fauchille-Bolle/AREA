import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Variable,
  VariableKind,
  VariableType,
} from './entities/variable.entity';
import {
  CreateVariableDto,
  UpdateVariableDto,
  VariableResponseDto,
} from './dto';

@Injectable()
export class VariablesService {
  constructor(
    @InjectRepository(Variable)
    private readonly variableRepository: Repository<Variable>,
  ) {}

  async create(
    createVariableDto: CreateVariableDto,
  ): Promise<VariableResponseDto> {
    const variable = this.variableRepository.create(createVariableDto);
    const savedVariable = await this.variableRepository.save(variable);
    return this.toResponseDto(savedVariable);
  }

  async findAll(): Promise<VariableResponseDto[]> {
    const variables = await this.variableRepository.find({
      relations: ['component'],
      order: { component_id: 'ASC', display_order: 'ASC' },
    });
    return variables.map((variable) => this.toResponseDto(variable));
  }

  async findOne(id: number): Promise<VariableResponseDto> {
    const variable = await this.variableRepository.findOne({
      where: { id },
      relations: ['component'],
    });

    if (!variable) {
      throw new NotFoundException(`Variable with ID ${id} not found`);
    }

    return this.toResponseDto(variable);
  }

  async findByComponent(componentId: number): Promise<VariableResponseDto[]> {
    const variables = await this.variableRepository.find({
      where: { component_id: componentId },
      relations: ['component'],
      order: { display_order: 'ASC' },
    });

    return variables.map((variable) => this.toResponseDto(variable));
  }

  async findByKind(kind: VariableKind): Promise<VariableResponseDto[]> {
    const variables = await this.variableRepository.find({
      where: { kind },
      relations: ['component'],
      order: { component_id: 'ASC', display_order: 'ASC' },
    });

    return variables.map((variable) => this.toResponseDto(variable));
  }

  async findByComponentAndKind(
    componentId: number,
    kind: VariableKind,
  ): Promise<VariableResponseDto[]> {
    const variables = await this.variableRepository.find({
      where: { component_id: componentId, kind },
      relations: ['component'],
      order: { display_order: 'ASC' },
    });

    return variables.map((variable) => this.toResponseDto(variable));
  }

  async findInputs(): Promise<VariableResponseDto[]> {
    return this.findByKind(VariableKind.PARAMETER);
  }

  async findOutputs(): Promise<VariableResponseDto[]> {
    return this.findByKind(VariableKind.RETURN_VALUE);
  }

  async findParameters(): Promise<VariableResponseDto[]> {
    return this.findByKind(VariableKind.PARAMETER);
  }

  async findInputsByComponent(
    componentId: number,
  ): Promise<VariableResponseDto[]> {
    return this.findByComponentAndKind(componentId, VariableKind.PARAMETER);
  }

  async findOutputsByComponent(
    componentId: number,
  ): Promise<VariableResponseDto[]> {
    return this.findByComponentAndKind(componentId, VariableKind.RETURN_VALUE);
  }

  async findParametersByComponent(
    componentId: number,
  ): Promise<VariableResponseDto[]> {
    return this.findByComponentAndKind(componentId, VariableKind.PARAMETER);
  }

  async findByType(type: VariableType): Promise<VariableResponseDto[]> {
    const variables = await this.variableRepository.find({
      where: { type },
      relations: ['component'],
      order: { component_id: 'ASC', display_order: 'ASC' },
    });

    return variables.map((variable) => this.toResponseDto(variable));
  }

  async findRequired(): Promise<VariableResponseDto[]> {
    const variables = await this.variableRepository.find({
      where: { nullable: false },
      relations: ['component'],
      order: { component_id: 'ASC', display_order: 'ASC' },
    });

    return variables.map((variable) => this.toResponseDto(variable));
  }

  async update(
    id: number,
    updateVariableDto: UpdateVariableDto,
  ): Promise<VariableResponseDto> {
    const variable = await this.variableRepository.findOne({
      where: { id },
      relations: ['component'],
    });

    if (!variable) {
      throw new NotFoundException(`Variable with ID ${id} not found`);
    }

    Object.assign(variable, updateVariableDto);
    const updatedVariable = await this.variableRepository.save(variable);
    return this.toResponseDto(updatedVariable);
  }

  async reorderVariables(
    componentId: number,
    variableIds: number[],
  ): Promise<VariableResponseDto[]> {
    const variables = await this.variableRepository.find({
      where: { component_id: componentId },
    });

    const variablesToUpdate: Variable[] = [];
    for (let i = 0; i < variableIds.length; i++) {
      const variable = variables.find((v) => v.id === variableIds[i]);
      if (variable) {
        variable.display_order = i;
        variablesToUpdate.push(variable);
      }
    }
    if (variablesToUpdate.length > 0) {
      await this.variableRepository.save(variablesToUpdate);
    }

    return this.findByComponent(componentId);
  }

  async remove(id: number): Promise<void> {
    const variable = await this.variableRepository.findOne({ where: { id } });
    if (!variable) {
      throw new NotFoundException(`Variable with ID ${id} not found`);
    }
    await this.variableRepository.remove(variable);
  }

  async removeByComponent(componentId: number): Promise<void> {
    const variables = await this.variableRepository.find({
      where: { component_id: componentId },
    });

    if (variables.length > 0) {
      await this.variableRepository.remove(variables);
    }
  }

  private toResponseDto(variable: Variable): VariableResponseDto {
    const response: VariableResponseDto = {
      id: variable.id,
      component_id: variable.component_id,
      name: variable.name,
      description: variable.description,
      kind: variable.kind,
      type: variable.type,
      nullable: variable.nullable,
      placeholder: variable.placeholder,
      validation_regex: variable.validation_regex,
      display_order: variable.display_order,
    };

    if (variable.component) {
      response.component = {
        id: variable.component.id,
        name: variable.component.name,
        type: variable.component.type,
      };
    }

    return response;
  }
}
