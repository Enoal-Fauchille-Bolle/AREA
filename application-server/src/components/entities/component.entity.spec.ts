import { Component, ComponentType } from './component.entity';

describe('Component Entity', () => {
  it('should create component instance', () => {
    const component = new Component();
    component.id = 1;
    component.service_id = 2;
    component.type = ComponentType.ACTION;
    component.name = 'Send Email';
    component.is_active = true;

    expect(component.id).toBe(1);
    expect(component.service_id).toBe(2);
    expect(component.type).toBe(ComponentType.ACTION);
    expect(component.name).toBe('Send Email');
    expect(component.is_active).toBe(true);
  });

  it('should handle nullable fields', () => {
    const component = new Component();
    component.description = null;
    component.webhook_endpoint = null;
    component.polling_interval = null;

    expect(component.description).toBeNull();
    expect(component.webhook_endpoint).toBeNull();
    expect(component.polling_interval).toBeNull();
  });

  it('should support both component types', () => {
    const action = new Component();
    action.type = ComponentType.ACTION;
    expect(action.type).toBe('action');

    const reaction = new Component();
    reaction.type = ComponentType.REACTION;
    expect(reaction.type).toBe('reaction');
  });

  it('should handle webhook endpoint', () => {
    const component = new Component();
    component.webhook_endpoint = '/webhooks/github/push';

    expect(component.webhook_endpoint).toBe('/webhooks/github/push');
  });

  it('should handle polling interval', () => {
    const component = new Component();
    component.polling_interval = 60;

    expect(component.polling_interval).toBe(60);
  });
});
