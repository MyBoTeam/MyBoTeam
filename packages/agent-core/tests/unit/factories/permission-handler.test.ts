import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/internal/classes/PermissionRequestHandler.js', () => ({
  PermissionRequestHandler: class MockPRH {
    constructor(readonly defaultTimeoutMs?: number) {}
    createRequest = vi.fn();
    resolveRequest = vi.fn();
  },
}));

import { createPermissionHandler } from '../../../src/factories/permission-handler.js';

describe('createPermissionHandler', () => {
  it('should create handler without options', () => {
    const result = createPermissionHandler();
    expect(result).toBeDefined();
    expect(typeof result.createRequest).toBe('function');
  });

  it('should create handler with options', () => {
    const result = createPermissionHandler({ defaultTimeoutMs: 5000 });
    expect(result).toBeDefined();
  });
});
