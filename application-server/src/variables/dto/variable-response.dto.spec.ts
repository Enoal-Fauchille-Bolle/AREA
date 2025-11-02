import { VariableResponseDto } from './variable-response.dto';
import {
  Variable,
  VariableKind,
  VariableType,
} from '../entities/variable.entity';

describe('VariableResponseDto', () => {
  describe('constructor', () => {
    it('should create instance with provided data', () => {
      const data: VariableResponseDto = {
        id: 1,
        component_id: 10,
        name: 'test_var',
        description: 'Test description',
        kind: VariableKind.PARAMETER,
        type: VariableType.STRING,
        optional: false,
        placeholder: 'Enter value',
        validation_regex: '^[a-z]+$',
        display_order: 0,
      };

      const dto = new VariableResponseDto(data);

      expect(dto.id).toBe(1);
      expect(dto.component_id).toBe(10);
      expect(dto.name).toBe('test_var');
      expect(dto.description).toBe('Test description');
      expect(dto.kind).toBe(VariableKind.PARAMETER);
      expect(dto.type).toBe(VariableType.STRING);
      expect(dto.optional).toBe(false);
      expect(dto.placeholder).toBe('Enter value');
      expect(dto.validation_regex).toBe('^[a-z]+$');
      expect(dto.display_order).toBe(0);
    });
  });

  describe('fromEntity', () => {
    it('should convert Variable entity to DTO', () => {
      const variable: Variable = {
        id: 2,
        component_id: 20,
        name: 'output_var',
        description: null,
        kind: VariableKind.RETURN_VALUE,
        type: VariableType.NUMBER,
        nullable: true,
        placeholder: null,
        validation_regex: null,
        display_order: 1,
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        component: null as any,
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      };

      const dto = VariableResponseDto.fromEntity(variable);

      expect(dto.id).toBe(2);
      expect(dto.component_id).toBe(20);
      expect(dto.name).toBe('output_var');
      expect(dto.description).toBeNull();
      expect(dto.kind).toBe(VariableKind.RETURN_VALUE);
      expect(dto.type).toBe(VariableType.NUMBER);
      expect(dto.optional).toBe(true);
      expect(dto.placeholder).toBeNull();
      expect(dto.validation_regex).toBeNull();
      expect(dto.display_order).toBe(1);
    });

    it('should handle all variable types', () => {
      const types = [
        VariableType.STRING,
        VariableType.NUMBER,
        VariableType.BOOLEAN,
        VariableType.DATE,
        VariableType.EMAIL,
        VariableType.URL,
        VariableType.JSON,
      ];

      types.forEach((type) => {
        const variable: Variable = {
          id: 1,
          component_id: 1,
          name: 'test',
          description: 'test',
          kind: VariableKind.PARAMETER,
          type,
          nullable: false,
          placeholder: null,
          validation_regex: null,
          display_order: 0,
          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          component: null as any,
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        };

        const dto = VariableResponseDto.fromEntity(variable);
        expect(dto.type).toBe(type);
      });
    });
  });
});
