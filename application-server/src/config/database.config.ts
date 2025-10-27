/**
 * Database constants for use in TypeORM entity decorators.
 */

// Column Length Constraints
export const DB_COLUMN_LENGTHS = {
  email: 255,
  username: 100,
  passwordHash: 255,
  serviceName: 100,
  componentName: 100,
  variableName: 100,
  webhookEndpoint: 255,
  areaName: 255,
  executionStatus: 20,
  hookStateKey: 255,
  oauth2ProviderUserId: 255,
} as const;

// Default Values
export const DB_DEFAULTS = {
  displayOrder: 0,
  triggeredCount: 0,
  isAdmin: false,
  isActive: true,
  requiresAuth: false,
} as const;
