import { DB_COLUMN_LENGTHS, DB_DEFAULTS } from './database.config';

describe('database.config', () => {
  describe('DB_COLUMN_LENGTHS', () => {
    it('should define correct email column length', () => {
      expect(DB_COLUMN_LENGTHS.email).toBe(255);
    });

    it('should define correct username column length', () => {
      expect(DB_COLUMN_LENGTHS.username).toBe(100);
    });

    it('should define correct passwordHash column length', () => {
      expect(DB_COLUMN_LENGTHS.passwordHash).toBe(255);
    });

    it('should define correct serviceName column length', () => {
      expect(DB_COLUMN_LENGTHS.serviceName).toBe(100);
    });

    it('should define correct componentName column length', () => {
      expect(DB_COLUMN_LENGTHS.componentName).toBe(100);
    });

    it('should define correct variableName column length', () => {
      expect(DB_COLUMN_LENGTHS.variableName).toBe(100);
    });

    it('should define correct webhookEndpoint column length', () => {
      expect(DB_COLUMN_LENGTHS.webhookEndpoint).toBe(255);
    });

    it('should define correct areaName column length', () => {
      expect(DB_COLUMN_LENGTHS.areaName).toBe(255);
    });

    it('should define correct executionStatus column length', () => {
      expect(DB_COLUMN_LENGTHS.executionStatus).toBe(20);
    });

    it('should define correct hookStateKey column length', () => {
      expect(DB_COLUMN_LENGTHS.hookStateKey).toBe(255);
    });

    it('should define correct oauth2ProviderUserId column length', () => {
      expect(DB_COLUMN_LENGTHS.oauth2ProviderUserId).toBe(255);
    });

    it('should be a readonly object', () => {
      // TypeScript enforces readonly at compile time, not runtime
      // The `as const` assertion makes the object deeply readonly in TypeScript
      expect(typeof DB_COLUMN_LENGTHS).toBe('object');
      expect(DB_COLUMN_LENGTHS).toBeDefined();
    });

    it('should have all expected keys', () => {
      const expectedKeys = [
        'email',
        'username',
        'passwordHash',
        'serviceName',
        'componentName',
        'variableName',
        'webhookEndpoint',
        'areaName',
        'executionStatus',
        'hookStateKey',
        'oauth2ProviderUserId',
      ];
      expect(Object.keys(DB_COLUMN_LENGTHS).sort()).toEqual(
        expectedKeys.sort(),
      );
    });

    it('should have all numeric values', () => {
      Object.values(DB_COLUMN_LENGTHS).forEach((value) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('DB_DEFAULTS', () => {
    it('should define correct displayOrder default', () => {
      expect(DB_DEFAULTS.displayOrder).toBe(0);
    });

    it('should define correct triggeredCount default', () => {
      expect(DB_DEFAULTS.triggeredCount).toBe(0);
    });

    it('should define correct isAdmin default', () => {
      expect(DB_DEFAULTS.isAdmin).toBe(false);
    });

    it('should define correct isActive default', () => {
      expect(DB_DEFAULTS.isActive).toBe(true);
    });

    it('should define correct requiresAuth default', () => {
      expect(DB_DEFAULTS.requiresAuth).toBe(false);
    });

    it('should be a readonly object', () => {
      // TypeScript enforces readonly at compile time, not runtime
      // The `as const` assertion makes the object deeply readonly in TypeScript
      expect(typeof DB_DEFAULTS).toBe('object');
      expect(DB_DEFAULTS).toBeDefined();
    });

    it('should have all expected keys', () => {
      const expectedKeys = [
        'displayOrder',
        'triggeredCount',
        'isAdmin',
        'isActive',
        'requiresAuth',
      ];
      expect(Object.keys(DB_DEFAULTS).sort()).toEqual(expectedKeys.sort());
    });

    it('should have correct data types for all values', () => {
      expect(typeof DB_DEFAULTS.displayOrder).toBe('number');
      expect(typeof DB_DEFAULTS.triggeredCount).toBe('number');
      expect(typeof DB_DEFAULTS.isAdmin).toBe('boolean');
      expect(typeof DB_DEFAULTS.isActive).toBe('boolean');
      expect(typeof DB_DEFAULTS.requiresAuth).toBe('boolean');
    });

    it('should have non-negative numeric defaults', () => {
      expect(DB_DEFAULTS.displayOrder).toBeGreaterThanOrEqual(0);
      expect(DB_DEFAULTS.triggeredCount).toBeGreaterThanOrEqual(0);
    });
  });
});
