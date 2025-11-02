import { ComponentResponseDto } from './component-response.dto';
import { Component, ComponentType } from '../entities/component.entity';

describe('ComponentResponseDto', () => {
  describe('constructor', () => {
    it('should create instance with provided data', () => {
      const data = {
        id: 1,
        service_id: 2,
        kind: ComponentType.ACTION,
        name: 'Test Component',
        description: 'Test description',
        is_active: true,
        webhook_endpoint: '/webhook',
        polling_interval: 300,
      };

      const dto = new ComponentResponseDto(data);

      expect(dto.id).toBe(1);
      expect(dto.service_id).toBe(2);
      expect(dto.kind).toBe(ComponentType.ACTION);
      expect(dto.name).toBe('Test Component');
      expect(dto.description).toBe('Test description');
      expect(dto.is_active).toBe(true);
      expect(dto.webhook_endpoint).toBe('/webhook');
      expect(dto.polling_interval).toBe(300);
    });
  });

  describe('fromEntity', () => {
    it('should convert Component entity to DTO', () => {
      const component: Component = {
        id: 1,
        service_id: 2,
        type: ComponentType.REACTION,
        name: 'Test Component',
        description: 'Test description',
        is_active: true,
        webhook_endpoint: null,
        polling_interval: 600,
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        service: null as any,
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      };

      const dto = ComponentResponseDto.fromEntity(component);

      expect(dto.id).toBe(1);
      expect(dto.service_id).toBe(2);
      expect(dto.kind).toBe(ComponentType.REACTION);
      expect(dto.name).toBe('Test Component');
      expect(dto.description).toBe('Test description');
      expect(dto.is_active).toBe(true);
      expect(dto.webhook_endpoint).toBeNull();
      expect(dto.polling_interval).toBe(600);
    });

    it('should handle null description', () => {
      const component: Component = {
        id: 1,
        service_id: 2,
        type: ComponentType.ACTION,
        name: 'Test',
        description: null,
        is_active: false,
        webhook_endpoint: null,
        polling_interval: null,
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        service: null as any,
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      };

      const dto = ComponentResponseDto.fromEntity(component);

      expect(dto.description).toBeNull();
      expect(dto.webhook_endpoint).toBeNull();
      expect(dto.polling_interval).toBeNull();
    });
  });
});
