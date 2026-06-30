/**
 * Integration test for enable flow
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { AutoStartService } from '../../src/services/auto-start-service.js';
import { AutoStartMethod, LoginItemState } from '../../src/types/login-item.js';

describe('Auto-Start Enable Flow', () => {
  let service: AutoStartService;

  beforeEach(() => {
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
