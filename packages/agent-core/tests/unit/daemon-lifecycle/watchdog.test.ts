import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DaemonProcessManager } from '../../../src/daemon/lifecycle/daemon-process-manager';
import { Watchdog } from '../../../src/daemon/lifecycle/watchdog';

describe('Watchdog', () => {
  let watchdog: Watchdog;
  let mockDaemonManager: DaemonProcessManager;

  beforeEach(() => {
    mockDaemonManager = {
      isRunning: vi.fn().mockReturnValue(true),
      on: vi.fn(),
      off: vi.fn(),
    } as any;

    watchdog = new Watchdog(mockDaemonManager, {
      healthCheckIntervalMs: 1000,
      maxConsecutiveFailures: 3,
    });
  });

  afterEach(() => {
    watchdog.stop();
  });

  describe('start()', () => {
    it('should start health monitoring', () => {
      watchdog.start();
      expect(watchdog.isRunning()).toBe(true);
    });

    it('should emit start event', () => {
      const startSpy = vi.fn();
      watchdog.on('start', startSpy);
      watchdog.start();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should stop health monitoring', () => {
      watchdog.start();
      watchdog.stop();
      expect(watchdog.isRunning()).toBe(false);
    });

    it('should emit stop event', () => {
      const stopSpy = vi.fn();
      watchdog.on('stop', stopSpy);
      watchdog.start();
      watchdog.stop();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('health check', () => {
    it('should detect daemon crash', async () => {
      const crashSpy = vi.fn();
      watchdog.on('crash', crashSpy);

      vi.mocked(mockDaemonManager.isRunning).mockReturnValue(false);

      watchdog.start();

      // Wait for 3 health checks (maxConsecutiveFailures)
      await new Promise((resolve) => setTimeout(resolve, 3100));

      expect(crashSpy).toHaveBeenCalled();
    });

    it('should track consecutive failures', async () => {
      vi.mocked(mockDaemonManager.isRunning).mockReturnValue(false);

      watchdog.start();

      // Wait for multiple health checks
      await new Promise((resolve) => setTimeout(resolve, 3100));

      expect(watchdog.getConsecutiveFailures()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStats()', () => {
    it('should return watchdog statistics', () => {
      const stats = watchdog.getStats();
      expect(stats).toHaveProperty('consecutiveFailures');
      expect(stats).toHaveProperty('lastCheckTime');
      expect(stats).toHaveProperty('totalChecks');
    });
  });
});
