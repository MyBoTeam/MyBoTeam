import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShutdownManager } from '../../../src/daemon/lifecycle/shutdown-manager';

describe('ShutdownManager', () => {
  let manager: ShutdownManager;

  beforeEach(() => {
    manager = new ShutdownManager({
      shutdownTimeoutMs: 5000,
      forceKillFn: vi.fn().mockResolvedValue(undefined),
      drainTasksFn: vi.fn().mockResolvedValue(0),
      cleanupResourcesFn: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    manager.removeAllListeners();
  });

  describe('initiateShutdown()', () => {
    it('should initiate graceful shutdown', async () => {
      const startSpy = vi.fn();
      manager.on('start', startSpy);

      // Start shutdown without awaiting to check intermediate state
      const shutdownPromise = manager.initiateShutdown();

      // Check isShuttingDown() during shutdown (before it completes)
      expect(manager.isShuttingDown()).toBe(true);

      await shutdownPromise;

      expect(startSpy).toHaveBeenCalled();
    });

    it('should complete shutdown', async () => {
      const completeSpy = vi.fn();
      manager.on('complete', completeSpy);

      await manager.initiateShutdown();

      expect(completeSpy).toHaveBeenCalled();
      expect(manager.isShuttingDown()).toBe(false);
    });

    it('should track shutdown statistics', async () => {
      await manager.initiateShutdown();

      const stats = manager.getStats();
      expect(stats.initiatedAt).toBeGreaterThan(0);
      expect(stats.completedAt).toBeGreaterThan(0);
      expect(stats.wasForced).toBe(false);
    });
  });

  describe('forceShutdown()', () => {
    it('should force shutdown immediately', async () => {
      const forceSpy = vi.fn();
      manager.on('force', forceSpy);

      await manager.forceShutdown();

      expect(forceSpy).toHaveBeenCalled();
      expect(manager.isShuttingDown()).toBe(false);
    });

    it('should mark shutdown as forced', async () => {
      await manager.forceShutdown();

      const stats = manager.getStats();
      expect(stats.wasForced).toBe(true);
    });
  });

  describe('isShuttingDown()', () => {
    it('should return false initially', () => {
      expect(manager.isShuttingDown()).toBe(false);
    });

    it('should return true during shutdown', async () => {
      const shutdownPromise = manager.initiateShutdown();
      expect(manager.isShuttingDown()).toBe(true);
      await shutdownPromise;
    });
  });

  describe('timeout handling', () => {
    it('should force kill on timeout', async () => {
      const forceKillFn = vi.fn().mockResolvedValue(undefined);
      const slowManager = new ShutdownManager({
        shutdownTimeoutMs: 100,
        forceKillFn,
        drainTasksFn: vi
          .fn()
          .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 200))),
        cleanupResourcesFn: vi.fn().mockResolvedValue(undefined),
      });

      await slowManager.initiateShutdown();

      expect(forceKillFn).toHaveBeenCalled();
    });
  });

  describe('subsequent signal handling', () => {
    it('should ignore subsequent shutdown signals', async () => {
      const startSpy = vi.fn();
      manager.on('start', startSpy);

      // Start shutdown
      const shutdownPromise1 = manager.initiateShutdown();

      // Try to start another shutdown
      await manager.initiateShutdown();

      // Should only emit start once
      expect(startSpy).toHaveBeenCalledTimes(1);

      await shutdownPromise1;
    });
  });
});
