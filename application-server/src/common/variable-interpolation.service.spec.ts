import { Test, TestingModule } from '@nestjs/testing';
import { VariableInterpolationService } from './variable-interpolation.service';

describe('VariableInterpolationService', () => {
  let service: VariableInterpolationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariableInterpolationService],
    }).compile();

    service = module.get<VariableInterpolationService>(
      VariableInterpolationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('interpolate', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!';
      const variables = { name: 'John' };
      const result = service.interpolate(template, variables);
      expect(result).toBe('Hello John!');
    });

    it('should replace multiple variables', () => {
      const template = 'User {{author_name}} said: {{message_content}}';
      const variables = {
        author_name: 'Alice',
        message_content: 'Hello world!',
      };
      const result = service.interpolate(template, variables);
      expect(result).toBe('User Alice said: Hello world!');
    });

    it('should handle missing variables by keeping placeholder', () => {
      const template = 'Hello {{name}} and {{missing}}!';
      const variables = { name: 'John' };
      const result = service.interpolate(template, variables);
      expect(result).toBe('Hello John and {{missing}}!');
    });

    it('should handle null and undefined values', () => {
      const template = 'Value: {{value}}';
      const variables = { value: null };
      const result = service.interpolate(template, variables);
      expect(result).toBe('Value: ');
    });

    it('should handle different data types', () => {
      const template = 'Number: {{num}}, Boolean: {{bool}}, Object: {{obj}}';
      const variables = {
        num: 42,
        bool: true,
        obj: { test: 'value' },
      };
      const result = service.interpolate(template, variables);
      expect(result).toBe(
        'Number: 42, Boolean: true, Object: {"test":"value"}',
      );
    });

    it('should handle Discord message interpolation example', () => {
      const template = 'New message from {{author_name}}: {{message_content}}';
      const variables = {
        author_name: 'DiscordUser123',
        author_id: '123456789012345678',
        message_content: 'Hello everyone! 👋',
        message_id: '987654321098765432',
        current_time: '2023-10-21T10:30:00.000Z',
      };
      const result = service.interpolate(template, variables);
      expect(result).toBe(
        'New message from DiscordUser123: Hello everyone! 👋',
      );
    });
  });

  describe('hasVariables', () => {
    it('should detect variables in template', () => {
      expect(service.hasVariables('Hello {{name}}')).toBe(true);
      expect(service.hasVariables('Hello world')).toBe(false);
      expect(service.hasVariables('{{var1}} and {{var2}}')).toBe(true);
    });
  });

  describe('extractVariableNames', () => {
    it('should extract variable names from template', () => {
      const template = 'Hello {{name}} and {{age}}!';
      const variables = service.extractVariableNames(template);
      expect(variables).toEqual(['name', 'age']);
    });

    it('should handle duplicate variables', () => {
      const template = '{{name}} said {{name}} again';
      const variables = service.extractVariableNames(template);
      expect(variables).toEqual(['name']);
    });
  });

  describe('interpolateObject', () => {
    it('should interpolate object properties', () => {
      const obj = {
        channel_id: '{{channel_id}}',
        content: 'Hello {{author_name}}!',
        number: 42,
      };
      const variables = {
        channel_id: '123456789012345678',
        author_name: 'Alice',
      };
      const result = service.interpolateObject(obj, variables);
      expect(result).toEqual({
        channel_id: '123456789012345678',
        content: 'Hello Alice!',
        number: 42,
      });
    });
  });
});
