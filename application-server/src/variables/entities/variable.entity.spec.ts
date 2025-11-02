import { Variable, VariableKind, VariableType } from './variable.entity';

describe('Variable Entity', () => {
  it('should create variable instance', () => {
    const variable = new Variable();
    variable.id = 1;
    variable.component_id = 2;
    variable.name = 'email';
    variable.kind = VariableKind.PARAMETER;
    variable.type = VariableType.EMAIL;
    variable.nullable = false;
    variable.display_order = 1;

    expect(variable.id).toBe(1);
    expect(variable.component_id).toBe(2);
    expect(variable.name).toBe('email');
    expect(variable.kind).toBe(VariableKind.PARAMETER);
    expect(variable.type).toBe(VariableType.EMAIL);
    expect(variable.nullable).toBe(false);
    expect(variable.display_order).toBe(1);
  });

  it('should handle nullable fields', () => {
    const variable = new Variable();
    variable.description = null;
    variable.placeholder = null;
    variable.validation_regex = null;

    expect(variable.description).toBeNull();
    expect(variable.placeholder).toBeNull();
    expect(variable.validation_regex).toBeNull();
  });

  it('should support both variable kinds', () => {
    const parameter = new Variable();
    parameter.kind = VariableKind.PARAMETER;
    expect(parameter.kind).toBe('parameter');

    const returnValue = new Variable();
    returnValue.kind = VariableKind.RETURN_VALUE;
    expect(returnValue.kind).toBe('return_value');
  });

  it('should support all variable types', () => {
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
      const variable = new Variable();
      variable.type = type;
      expect(variable.type).toBe(type);
    });
  });

  it('should handle validation regex', () => {
    const variable = new Variable();
    variable.validation_regex = '^[a-zA-Z0-9]+$';

    expect(variable.validation_regex).toBe('^[a-zA-Z0-9]+$');
  });

  it('should handle placeholder', () => {
    const variable = new Variable();
    variable.placeholder = 'Enter your email address';

    expect(variable.placeholder).toBe('Enter your email address');
  });
});
