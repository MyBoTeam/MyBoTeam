/**
 * Integration test for status check flow
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginItemPersistence } from '../../../src/daemon/login-item-persistence.js';
import { AutoStartService } from '../../../src/services/auto-start-service.js';
import { AutoStartMethod, LoginItemState } from '../../../src/types/login-item.js';

vi.mock('../../../src/daemon/login-item-system-query.js', () => ({
  querySystemLoginItem: vi.fn().mockResolvedValue({
    registered: true,
    method: 'MyBoTeamDefaults',
    path: '/usr/local/bin/daemon',
  }),
  buildStatusFromSystemQuery: vi.fn().mockReturnValue({
    enabled: true,
    state: 'Enabled',
    method: 'MyBoTeamDefaults',
    synced: true,
    lastChecked: new Date().toISOString(),
  }),
}));

describe('Auto-Start Status Check Integration', () => {
  let service: AutoStartService;

  beforeEach(() => {
    new LoginItemPersistence().clear();
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
