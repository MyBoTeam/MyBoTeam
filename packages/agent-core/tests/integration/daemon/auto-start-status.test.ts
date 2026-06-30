/**
 * Integration test for status check flow
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { AutoStartService } from '../../src/services/auto-start-service.js';

describe('Auto-Start Status Check Integration', () => {
  let service: AutoStartService;

  beforeEach(() => {
    service = new AutoStartService();
  });

  describe('status check flow', () => {
    it('should check status after enabling', async () => {
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const status = await service.getStatus('com.test.daemon');
      expect(status.enabled).toBe(true);
      expect(status.lastChecked).toBeDefined();
    });

    it('should check status after disabling', async () => {
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      await service.disable('com.test.daemon');

      const status = await service.getStatus('com.test.daemon');
      expect(status.enabled).toBe(false);
    });

    it('should sync with system on status check', async () => {
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const status = await service.syncWithSystem('com.test.daemon');
      expect(status.synced).toBe(true);
    });

    it('should log status check operations', async () => {
      await service.getStatus('com.test.daemon');
      const logs = service.getLogs();
      expect(logs.some((log) => log.event === 'STATUS_CHECK')).toBe(true);
    });
  });
});
