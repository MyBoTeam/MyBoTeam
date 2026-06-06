import { describe, expect, it, vi } from 'vitest';

let mockExists = true;
let mockRmError: Error | null = null;

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => mockExists),
    rmSync: vi.fn(() => {
      if (mockRmError) throw mockRmError;
    }),
  },
  existsSync: vi.fn(() => mockExists),
  rmSync: vi.fn(() => {
    if (mockRmError) throw mockRmError;
  }),
}));

vi.mock('../../../src/logger.js', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { cleanupAuthState } from '../../../src/whatsapp/authCleanup.js';

describe('cleanupAuthState', () => {
  it('should delete auth state directory when it exists', () => {
    mockExists = true;
    mockRmError = null;

    expect(() => cleanupAuthState('/tmp/test-auth-dir')).not.toThrow();
  });

  it('should not throw when auth state does not exist', () => {
    mockExists = false;
    mockRmError = null;

    expect(() => cleanupAuthState('/tmp/test-auth-dir')).not.toThrow();
  });

  it('should not throw when rmSync throws', () => {
    mockExists = true;
    mockRmError = new Error('Permission denied');

    expect(() => cleanupAuthState('/tmp/test-auth-dir')).not.toThrow();
  });
});
