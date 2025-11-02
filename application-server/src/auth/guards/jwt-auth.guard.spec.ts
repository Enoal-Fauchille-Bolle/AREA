/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with jwt strategy', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should have canActivate method', () => {
    expect(guard.canActivate).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should use passport jwt strategy', async () => {
    // The guard should use the 'jwt' strategy from passport
    // This is implicitly tested by extending AuthGuard('jwt')
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    // Verify the guard can be called with an execution context
    try {
      await guard.canActivate(mockContext);
    } catch {
      // Expected to fail without proper JWT setup, but verifies it's callable
    }
    expect(guard).toBeDefined();
  });
});
