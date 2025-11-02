import { Area } from './area.entity';

describe('Area Entity', () => {
  it('should create area instance', () => {
    const area = new Area();
    area.id = 1;
    area.user_id = 10;
    area.component_action_id = 20;
    area.component_reaction_id = 30;
    area.name = 'Test Area';
    area.description = 'Test description';
    area.is_active = true;
    area.triggered_count = 5;

    expect(area.id).toBe(1);
    expect(area.user_id).toBe(10);
    expect(area.name).toBe('Test Area');
    expect(area.is_active).toBe(true);
    expect(area.triggered_count).toBe(5);
  });

  it('should handle nullable fields', () => {
    const area = new Area();
    area.last_triggered_at = null;

    expect(area.last_triggered_at).toBeNull();
  });

  it('should support date fields', () => {
    const area = new Area();
    const now = new Date();
    area.created_at = now;
    area.updated_at = now;

    expect(area.created_at).toBe(now);
    expect(area.updated_at).toBe(now);
  });
});
