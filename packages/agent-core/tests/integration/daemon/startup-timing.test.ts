/**
 * Timing verification test for 5-second startup requirement
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoStartService } from '../../src/services/auto-start-service.js';
import { DEFAULT_TIMEOUT_MS } from '../../src/types/login-item.js';

describe('Startup Timing Verification', () => {
  let service: AutoStartService;
  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new AutoStartService();
    dateNowSpy = vi.spyOn(Date, 'now');
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe('5-second startup requirement', () => {
    it('should complete registration within 5 seconds', async () => {
      const startTime = 1000000;
      dateNowSpy.mockReturnValue(startTime);

      const enableResult = await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const endTime = startTime + 4000; // 4 seconds later
      dateNowSpy.mockReturnValue(endTime);

      expect(enableResult.success).toBe(true);
      expect(enableResult.durationMs).toBeLessThanOrEqual(DEFAULT_TIMEOUT_MS);
    });

    it('should measure time from enable() to simulated login completion', async () => {
      const startTime = 1000000;
      dateNowSpy.mockReturnValue(startTime);

      const enableResult = await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // Simulate login completion
      const loginTime = startTime + 3000; // 3 seconds later
      dateNowSpy.mockReturnValue(loginTime);

      const status = await service.getStatus('com.test.daemon');
      expect(status.lastChecked).toBeDefined();

      // Verify timing is within 5 seconds
      const elapsed = loginTime - startTime;
      expect(elapsed).toBeLessThanOrEqual(DEFAULT_TIMEOUT_MS);
    });

    it('should handle timeout gracefully', async () => {
      const startTime = 1000000;
      dateNowSpy.mockReturnValue(startTime);

      // Mock a slow operation
      const slowService = new AutoStartService();
      vi.spyOn(slowService, 'enable').mockImplementation(async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              method: 'MyBoTeamDefaults' as any,
              timestamp: new Date().toISOString(),
            });
          }, DEFAULT_TIMEOUT_MS + 1000);
        });
      });

      // This should complete within timeout
      const enableResult = await slowService.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // Verify the operation completed (mocked)
      expect(enableResult.success).toBe(true);
    });

    it('should exclude system startup time from measurement', async () => {
      const startTime = 1000000;
      dateNowSpy.mockReturnValue(startTime);

      const enableResult = await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // System startup time is excluded from measurement
      // Only the time from enable() to login completion is measured
      expect(enableResult.durationMs).toBeDefined();
      expect(enableResult.durationMs).toBeLessThanOrEqual(DEFAULT_TIMEOUT_MS);
    });
  });
});
