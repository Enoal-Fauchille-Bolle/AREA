import { HookState } from './hook-state.entity';

describe('HookState Entity', () => {
  it('should create hook state instance', () => {
    const hookState = new HookState();
    hookState.area_id = 1;
    hookState.state_key = 'last_message_id';
    hookState.state_value = '12345';

    expect(hookState.area_id).toBe(1);
    expect(hookState.state_key).toBe('last_message_id');
    expect(hookState.state_value).toBe('12345');
  });

  it('should handle nullable fields', () => {
    const hookState = new HookState();
    hookState.state_value = null;
    hookState.last_checked_at = null;

    expect(hookState.state_value).toBeNull();
    expect(hookState.last_checked_at).toBeNull();
  });

  it('should support date fields', () => {
    const hookState = new HookState();
    const now = new Date();
    hookState.created_at = now;
    hookState.updated_at = now;
    hookState.last_checked_at = now;

    expect(hookState.created_at).toBe(now);
    expect(hookState.updated_at).toBe(now);
    expect(hookState.last_checked_at).toBe(now);
  });
});
