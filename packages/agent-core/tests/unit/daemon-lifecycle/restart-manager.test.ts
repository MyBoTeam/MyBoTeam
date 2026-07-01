import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RestartManager } from '../../../src/daemon/lifecycle/restart-manager';

describe('RestartManager', () => {
  let manager: RestartManager;
  let mockRestartFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRestartFn = vi.fn().mockResolvedValue(undefined);

    manager = new RestartManager({
      baseRestartDelayMs: 100,
      maxRestartDelayMs: 1000,
      maxRestartAttempts: 3,
      stabilityPeriodMs: 500,
      restartFn: mockRestartFn,
    });
  });

  afterEach(() => {
    manager.stop();
  });

  describe('scheduleRestart()', () => {
    it('should schedule restart with exponential backoff', async () => {
      const scheduledSpy = vi.fn();
      manager.on('restartScheduled', scheduledSpy);

      manager.scheduleRestart();

      expect(scheduledSpy).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1 }));
    });

    it('should increase delay with each attempt', async () => {
      manager.scheduleRestart();
      await new Promise((resolve) => setTimeout(resolve, 150));

      manager.scheduleRestart();

      const stats = manager.getStats();
      expect(stats.attempts).toBe(2);
      expect(stats.currentDelay).toBeGreaterThan(100);
    });

    it('should emit restart event when restart is triggered', async () => {
      const restartSpy = vi.fn();
      manager.on('restart', restartSpy);

      manager.scheduleRestart();
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(restartSpy).toHaveBeenCalled();
    });
  });

  describe('resetBackoff()', () => {
    it('should reset backoff after stability period', async () => {
      manager.scheduleRestart();
      // Wait for restart to fire (100ms base delay) + stability period (500ms)
      await new Promise((resolve) => setTimeout(resolve, 700));

      const stats = manager.getStats();
      expect(stats.attempts).toBe(0);
      expect(stats.currentDelay).toBe(0);
    });
  });

  describe('max attempts', () => {
    it('should stop restarting after max attempts', async () => {
      const maxReachedSpy = vi.fn();
      manager.on('maxAttemptsReached', maxReachedSpy);

      // Schedule restarts until max is reached
      for (let i = 0; i < 4; i++) {
        manager.scheduleRestart();
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      expect(maxReachedSpy).toHaveBeenCalled();
    });
  });

  describe('getStats()', () => {
    it('should return restart statistics', () => {
      const stats = manager.getStats();
      expect(stats).toHaveProperty('attempts');
      expect(stats).toHaveProperty('currentDelay');
      expect(stats).toHaveProperty('lastRestartTime');
    });
  });
});
