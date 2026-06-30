/**
 * Integration test for disable flow
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { AutoStartService } from '../../../src/services/auto-start-service.js';
import { LoginItemPersistence } from '../../../src/daemon/login-item-persistence.js';

describe('Auto-Start Disable Integration', () => {
  let service: AutoStartService;

  beforeEach(() => {
    new LoginItemPersistence().clear();
    service = new AutoStartService();
  });

  describe('disable flow', () => {
    it('should disable auto-start after enabling', async () => {
      // Enable first
      const enableResult = await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });
      expect(enableResult.success).toBe(true);

      // Now disable
      const disableResult = await service.disable('com.test.daemon');
      expect(disableResult.success).toBe(true);

      // Verify status
      const status = await service.getStatus('com.test.daemon');
      expect(status.enabled).toBe(false);
    });

    it('should handle disable when not enabled', async () => {
      const disableResult = await service.disable('com.test.daemon');
      expect(disableResult.success).toBe(true);

      const status = await service.getStatus('com.test.daemon');
      expect(status.enabled).toBe(false);
    });

    it('should persist disabled state', async () => {
      // Enable
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // Disable
      await service.disable('com.test.daemon');

      // Verify persistence
      const preference = service.getAutoStartPreference();
      expect(preference?.enabled).toBe(false);
    });

    it('should log disable operation', async () => {
      // Enable first
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // Disable
      await service.disable('com.test.daemon');

      // Verify logging
      const logs = service.getLogs();
      expect(logs.some((log) => log.event === 'UNREGISTER')).toBe(true);
    });
  });
});
