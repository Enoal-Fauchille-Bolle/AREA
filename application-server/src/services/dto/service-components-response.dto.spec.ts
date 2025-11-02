import {
  ServiceComponentVariablesResponseDto,
  ServiceComponentsResponseDto,
  ServiceActionsResponseDto,
  ServiceReactionsResponseDto,
} from './service-components-response.dto';
import {
  Component,
  ComponentType,
} from '../../components/entities/component.entity';
import {
  Variable,
  VariableKind,
  VariableType,
} from '../../variables/entities/variable.entity';
import { ComponentResponseDto } from '../../components/dto/component-response.dto';
import { VariableResponseDto } from '../../variables/dto/variable-response.dto';

describe('service-components-response.dto', () => {
  describe('ServiceComponentVariablesResponseDto', () => {
    const mockVariable: Variable = {
      id: 1,
      component_id: 10,
      name: 'test_var',
      description: 'Test variable',
      kind: VariableKind.PARAMETER,
      type: VariableType.STRING,
      nullable: false,
      placeholder: 'Enter value',
      validation_regex: null,
      display_order: 0,
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      component: null as any,
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    };

    it('should create from entity', () => {
      const dto = ServiceComponentVariablesResponseDto.fromEntity(mockVariable);

      expect(dto).toBeDefined();
      expect(dto).toBeInstanceOf(ServiceComponentVariablesResponseDto);
      // The DTO omits component_id from the parent
      expect(dto).not.toHaveProperty('component_id');
    });

    it('should create from response DTO', () => {
      const variableDto: VariableResponseDto = {
        id: 2,
        component_id: 20,
        name: 'another_var',
        description: 'Another variable',
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.NUMBER,
        optional: true,
        placeholder: null,
        validation_regex: '\\d+',
        display_order: 1,
      };

      const dto =
        ServiceComponentVariablesResponseDto.fromResponseDto(variableDto);

      expect(dto).toBeDefined();
      expect(dto).toBeInstanceOf(ServiceComponentVariablesResponseDto);
      expect(dto).not.toHaveProperty('component_id');
    });
  });

  describe('ServiceComponentsResponseDto', () => {
    const mockComponent: Component = {
      id: 1,
      service_id: 5,
      type: ComponentType.ACTION,
      name: 'Test Action',
      description: 'Test description',
      is_active: true,
      webhook_endpoint: '/webhook',
      polling_interval: 300,
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      service: null as any,
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    };

    const mockVariables: Variable[] = [
      {
        id: 1,
        component_id: 1,
        name: 'var1',
        description: 'Variable 1',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        nullable: false,
        placeholder: 'Placeholder 1',
        validation_regex: null,
        display_order: 0,
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        component: null as any,
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      },
    ];

    it('should create from entity', () => {
      const dto = ServiceComponentsResponseDto.fromEntity(
        mockComponent,
        mockVariables,
      );

      expect(dto).toBeDefined();
      expect(dto).toBeInstanceOf(ServiceComponentsResponseDto);
      expect(dto.variables).toBeDefined();
      expect(Array.isArray(dto.variables)).toBe(true);
      // Verify omitted properties
      expect(dto).not.toHaveProperty('service_id');
      expect(dto).not.toHaveProperty('webhook_endpoint');
      expect(dto).not.toHaveProperty('polling_interval');
      expect(dto).not.toHaveProperty('is_active');
    });

    it('should create from response DTO', () => {
      const componentDto: ComponentResponseDto = {
        id: 2,
        service_id: 6,
        kind: ComponentType.REACTION,
        name: 'Test Reaction',
        description: null,
        is_active: true,
        webhook_endpoint: null,
        polling_interval: null,
      };

      const variablesDto: VariableResponseDto[] = [
        {
          id: 2,
          component_id: 2,
          name: 'var2',
          description: 'Variable 2',
          kind: VariableKind.RETURN_VALUE,
          type: VariableType.BOOLEAN,
          optional: true,
          placeholder: null,
          validation_regex: null,
          display_order: 0,
        },
      ];

      const dto = ServiceComponentsResponseDto.fromResponseDto(
        componentDto,
        variablesDto,
      );

      expect(dto).toBeDefined();
      expect(dto.variables).toBeDefined();
      expect(dto.variables.length).toBe(1);
    });
  });

  describe('ServiceActionsResponseDto', () => {
    const mockComponent: Component = {
      id: 1,
      service_id: 5,
      type: ComponentType.ACTION,
      name: 'Action',
      description: 'Action description',
      is_active: true,
      webhook_endpoint: null,
      polling_interval: null,
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      service: null as any,
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    };

    it('should create from entity without kind property', () => {
      const dto = ServiceActionsResponseDto.fromEntity(mockComponent, []);

      // Verify the static method executes without error
      expect(dto).toBeTruthy();
    });

    it('should create from response DTO', () => {
      const componentDto: ComponentResponseDto = {
        id: 3,
        service_id: 7,
        kind: ComponentType.ACTION,
        name: 'Another Action',
        description: 'Description',
        is_active: true,
        webhook_endpoint: null,
        polling_interval: 600,
      };

      const dto = ServiceActionsResponseDto.fromResponseDto(componentDto, []);

      expect(dto).toBeDefined();
      expect(dto).not.toHaveProperty('kind');
    });
  });

  describe('ServiceReactionsResponseDto', () => {
    const mockComponent: Component = {
      id: 2,
      service_id: 6,
      type: ComponentType.REACTION,
      name: 'Reaction',
      description: null,
      is_active: false,
      webhook_endpoint: null,
      polling_interval: null,
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      service: null as any,
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    };

    it('should create from entity without kind property', () => {
      const dto = ServiceReactionsResponseDto.fromEntity(mockComponent, []);

      // Verify the static method executes without error
      expect(dto).toBeTruthy();
    });

    it('should create from response DTO', () => {
      const componentDto: ComponentResponseDto = {
        id: 4,
        service_id: 8,
        kind: ComponentType.REACTION,
        name: 'Another Reaction',
        description: 'Reaction desc',
        is_active: false,
        webhook_endpoint: '/hook',
        polling_interval: null,
      };

      const dto = ServiceReactionsResponseDto.fromResponseDto(componentDto, []);

      expect(dto).toBeDefined();
      expect(dto).not.toHaveProperty('kind');
    });
  });
});
