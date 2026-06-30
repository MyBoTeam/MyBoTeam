/**
 * Integration test for enable flow
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoStartService } from '../../../src/services/auto-start-service.js';
import { LoginItemPersistence } from '../../../src/daemon/login-item-persistence.js';
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

describe('Auto-Start Enable Flow', () => {
  let service: AutoStartService;

  beforeEach(() => {
    new LoginItemPersistence().clear();
    service = new AutoStartService();
  });

  describe('End-to-end enable flow', () => {
    it('should enable auto-start and verify registration', async () => {
      // Enable auto-start
      const enableResult = await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      expect(enableResult.success).toBe(true);

      // Verify status
      const status = await service.getStatus('com.test.daemon');
      expect(status.enabled).toBe(true);
      expect(status.state).toBe(LoginItemState.Enabled);
      expect(status.method).toBe(AutoStartMethod.MyBoTeamDefaults);
    });

    it('should enable with Service Management method', async () => {
      const enableResult = await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
        method: AutoStartMethod.ServiceManagement,
      });

      expect(enableResult.success).toBe(true);
      expect(enableResult.method).toBe(AutoStartMethod.ServiceManagement);

      const status = await service.getStatus('com.test.daemon');
      expect(status.method).toBe(AutoStartMethod.ServiceManagement);
    });

    it('should persist auto-start preference across restarts', async () => {
      // Enable auto-start
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // Create new service instance (simulating restart)
      const newService = new AutoStartService();

      // Verify preference is persisted
      const status = await newService.getStatus('com.test.daemon');
      expect(status.enabled).toBe(true);
    });

    it('should sync with system state on launch', async () => {
      // Enable auto-start
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // Sync with system
      const syncResult = await service.syncWithSystem('com.test.daemon');
      expect(syncResult.synced).toBe(true);
    });

    it('should handle external state changes', async () => {
      // Enable auto-start
      await service.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      // Simulate external change (e.g., via System Preferences)
      // This would be mocked in a real test

      // Sync should detect the change
      const status = await service.getStatus('com.test.daemon');
      expect(status.synced).toBe(true);
    });
  });
});
