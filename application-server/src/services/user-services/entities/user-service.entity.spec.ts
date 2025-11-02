import { UserService } from './user-service.entity';

describe('UserService Entity', () => {
  it('should create user service instance', () => {
    const userService = new UserService();
    userService.user_id = 1;
    userService.service_id = 2;
    userService.oauth_token = 'access_token_123';
    userService.refresh_token = 'refresh_token_456';

    expect(userService.user_id).toBe(1);
    expect(userService.service_id).toBe(2);
    expect(userService.oauth_token).toBe('access_token_123');
    expect(userService.refresh_token).toBe('refresh_token_456');
  });

  it('should handle nullable fields', () => {
    const userService = new UserService();
    userService.oauth_token = null;
    userService.refresh_token = null;
    userService.token_expires_at = null;

    expect(userService.oauth_token).toBeNull();
    expect(userService.refresh_token).toBeNull();
    expect(userService.token_expires_at).toBeNull();
  });

  it('should support date fields', () => {
    const userService = new UserService();
    const now = new Date();
    userService.created_at = now;
    userService.updated_at = now;
    userService.token_expires_at = now;

    expect(userService.created_at).toBe(now);
    expect(userService.updated_at).toBe(now);
    expect(userService.token_expires_at).toBe(now);
  });
});
