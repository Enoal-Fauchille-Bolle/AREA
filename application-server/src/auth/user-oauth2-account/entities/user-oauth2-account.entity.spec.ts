import { UserOAuth2Account } from './user-oauth2-account.entity';

describe('UserOAuth2Account Entity', () => {
  it('should create user oauth2 account instance', () => {
    const account = new UserOAuth2Account();
    account.service_id = 1;
    account.service_account_id = 'google-123';
    account.user_id = 1;
    account.email = 'user@example.com';

    expect(account.service_id).toBe(1);
    expect(account.service_account_id).toBe('google-123');
    expect(account.user_id).toBe(1);
    expect(account.email).toBe('user@example.com');
  });

  it('should handle nullable email', () => {
    const account = new UserOAuth2Account();
    account.email = null;

    expect(account.email).toBeNull();
  });

  it('should support date fields', () => {
    const account = new UserOAuth2Account();
    const now = new Date();
    account.created_at = now;

    expect(account.created_at).toBe(now);
  });
});
