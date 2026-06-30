import { beforeEach, describe, expect, it } from 'vitest';
import { createShutdownManager } from '../../packages/agent-core/src/daemon/shutdown-manager.js';

describe('Shutdown Manager', () => {
  let shutdownManager: ReturnType<typeof createShutdownManager>;

  beforeEach(() => {
    shutdownManager = createShutdownManager();
  });

  describe('createShutdownManager', () => {
    it('should create shutdown manager with default timeout', () => {
      const state = shutdownManager.getState();
      expect(state.isShuttingDown).toBe(false);
      expect(state.shutdownStartTime).toBeNull();
      expect(state.drainTimeoutMs).toBe(30000);
    });

    it('should create shutdown manager with custom timeout', () => {
      const customManager = createShutdownManager(60000);
      const state = customManager.getState();
      expect(state.drainTimeoutMs).toBe(60000);
    });
  });

  describe('initiateShutdown', () => {
    it('should initiate shutdown successfully', () => {
      const result = shutdownManager.initiateShutdown();
      expect(result).toBe(true);

      const state = shutdownManager.getState();
      expect(state.isShuttingDown).toBe(true);
      expect(state.shutdownStartTime).toBeInstanceOf(Date);
    });

    it('should reject subsequent shutdown requests (idempotent)', () => {
      shutdownManager.initiateShutdown();
      const result = shutdownManager.initiateShutdown();
      expect(result).toBe(false);
    });
  });

  describe('getDrainTimeout', () => {
    it('should return drain timeout', () => {
      const timeout = shutdownManager.getDrainTimeout();
      expect(timeout).toBe(30000);
    });

    it('should return custom drain timeout', () => {
      const customManager = createShutdownManager(60000);
      const timeout = customManager.getDrainTimeout();
      expect(timeout).toBe(60000);
    });
  });
});
