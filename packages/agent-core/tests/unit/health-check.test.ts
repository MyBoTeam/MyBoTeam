import { describe, expect, it, vi } from 'vitest';
import { checkHealth } from '../../src/providers/tools/health-check';

describe('Health Check', () => {
  describe('checkHealth', () => {
    it('should return healthy status on success', async () => {
      const healthCheckFn = vi.fn().mockResolvedValue({
        healthy: true,
        latency: 100,
        timestamp: new Date().toISOString(),
      });

      const result = await checkHealth(healthCheckFn);

      expect(result.healthy).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy status on failure', async () => {
      const healthCheckFn = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await checkHealth(healthCheckFn);

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should handle timeout', async () => {
      const healthCheckFn = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      const result = await checkHealth(healthCheckFn, 50);

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Health check timeout');
    });

    it('should clean up timeout timer after timeout fires', async () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const healthCheckFn = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          healthy: true,
          latency: 0,
          timestamp: new Date().toISOString(),
        }), 10000)),
      );

      const resultPromise = checkHealth(healthCheckFn, 100);
      vi.advanceTimersByTime(150);
      const result = await resultPromise;

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Health check timeout');
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should measure latency correctly', async () => {
      const healthCheckFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  healthy: true,
                  latency: 0,
                  timestamp: new Date().toISOString(),
                }),
              50,
            ),
          ),
      );

      const result = await checkHealth(healthCheckFn);

      expect(result.latency).toBeGreaterThanOrEqual(40);
    });
  });
});
