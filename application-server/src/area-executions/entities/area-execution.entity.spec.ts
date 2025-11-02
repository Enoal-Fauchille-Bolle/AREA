import { AreaExecution, ExecutionStatus } from './area-execution.entity';

describe('AreaExecution Entity', () => {
  it('should create area execution instance', () => {
    const execution = new AreaExecution();
    execution.id = 1;
    execution.areaId = 10;
    execution.status = ExecutionStatus.SUCCESS;
    execution.startedAt = new Date();

    expect(execution.id).toBe(1);
    expect(execution.areaId).toBe(10);
    expect(execution.status).toBe(ExecutionStatus.SUCCESS);
    expect(execution.startedAt).toBeInstanceOf(Date);
  });

  it('should handle nullable fields', () => {
    const execution = new AreaExecution();
    execution.triggerData = null;
    execution.executionResult = null;
    execution.errorMessage = null;
    execution.completedAt = null;
    execution.executionTimeMs = null;

    expect(execution.triggerData).toBeNull();
    expect(execution.executionResult).toBeNull();
    expect(execution.errorMessage).toBeNull();
    expect(execution.completedAt).toBeNull();
    execution.executionTimeMs = null;
  });

  it('should support all execution statuses', () => {
    const statuses = [
      ExecutionStatus.PENDING,
      ExecutionStatus.RUNNING,
      ExecutionStatus.SUCCESS,
      ExecutionStatus.FAILED,
      ExecutionStatus.CANCELLED,
      ExecutionStatus.SKIPPED,
    ];

    statuses.forEach((status) => {
      const execution = new AreaExecution();
      execution.status = status;
      expect(execution.status).toBe(status);
    });
  });

  it('should handle trigger data as JSONB', () => {
    const execution = new AreaExecution();
    const triggerData = { eventId: '123', timestamp: '2025-01-01T00:00:00Z' };
    execution.triggerData = triggerData;

    expect(execution.triggerData).toEqual(triggerData);
  });

  it('should handle execution result as JSONB', () => {
    const execution = new AreaExecution();
    const result = { success: true, message: 'Task completed' };
    execution.executionResult = result;

    expect(execution.executionResult).toEqual(result);
  });

  it('should handle error messages', () => {
    const execution = new AreaExecution();
    execution.status = ExecutionStatus.FAILED;
    execution.errorMessage = 'Connection timeout';

    expect(execution.errorMessage).toBe('Connection timeout');
  });

  it('should handle execution time', () => {
    const execution = new AreaExecution();
    execution.executionTimeMs = 1500;

    expect(execution.executionTimeMs).toBe(1500);
  });

  it('should support date fields', () => {
    const execution = new AreaExecution();
    const now = new Date();
    execution.createdAt = now;
    execution.updatedAt = now;
    execution.startedAt = now;
    execution.completedAt = now;

    expect(execution.createdAt).toBe(now);
    expect(execution.updatedAt).toBe(now);
    expect(execution.startedAt).toBe(now);
    expect(execution.completedAt).toBe(now);
  });
});
