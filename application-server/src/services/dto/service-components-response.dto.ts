import { OmitType } from '@nestjs/mapped-types';
import { ComponentResponseDto } from '../../components/dto/component-response.dto';
import { VariableResponseDto } from '../../variables/dto/variable-response.dto';
import { Component } from '../../components/entities/component.entity';
import { Variable } from '../../variables/entities/variable.entity';

export class ServiceComponentVariablesResponseDto extends OmitType(
  VariableResponseDto,
  ['component_id'],
) {
  constructor(data: ServiceComponentVariablesResponseDto) {
    super(data);
  }

  static fromEntity(variable: Variable): ServiceComponentVariablesResponseDto {
    return new ServiceComponentVariablesResponseDto({
      id: variable.id,
      name: variable.name,
      description: variable.description,
      kind: variable.kind,
      type: variable.type,
      optional: variable.nullable,
      placeholder: variable.placeholder,
      validation_regex: variable.validation_regex,
      display_order: variable.display_order,
    });
  }
}

export class ServiceComponentsResponseDto extends OmitType(
  ComponentResponseDto,
  ['service_id', 'webhook_endpoint', 'polling_interval', 'is_active'],
) {
  variables: ServiceComponentVariablesResponseDto[];

  constructor(data: ServiceComponentsResponseDto) {
    super(data);
    this.variables = data.variables;
  }

  static fromEntity(
    component: Component,
    variables: Variable[],
  ): ServiceComponentsResponseDto {
    return new ServiceComponentsResponseDto({
      id: component.id,
      kind: component.type,
      name: component.name,
      description: component.description,
      variables: variables.map((v) =>
        ServiceComponentVariablesResponseDto.fromEntity(v),
      ),
    });
  }
}

export class ServiceActionsResponseDto extends OmitType(
  ServiceComponentsResponseDto,
  ['kind'],
) {
  constructor(data: ServiceActionsResponseDto) {
    super(data);
  }

  static fromEntity(
    component: Component,
    variables: Variable[],
  ): ServiceActionsResponseDto {
    return new ServiceActionsResponseDto({
      id: component.id,
      name: component.name,
      description: component.description,
      variables: variables.map((v) =>
        ServiceComponentVariablesResponseDto.fromEntity(v),
      ),
    });
  }
}

export class ServiceReactionsResponseDto extends OmitType(
  ServiceComponentsResponseDto,
  ['kind'],
) {
  constructor(data: ServiceReactionsResponseDto) {
    super(data);
  }

  static fromEntity(
    component: Component,
    variables: Variable[],
  ): ServiceReactionsResponseDto {
    return new ServiceReactionsResponseDto({
      id: component.id,
      name: component.name,
      description: component.description,
      variables: variables.map((v) =>
        ServiceComponentVariablesResponseDto.fromEntity(v),
      ),
    });
  }
}
