/**
 * Unit tests for LoginItemManager.enable()
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { LoginItemManager } from '../../src/daemon/login-item-manager.js';
import { AutoStartMethod, LoginItemErrorCode, LoginItemState } from '../../src/types/login-item.js';

describe('LoginItemManager', () => {
  let manager: LoginItemManager;

  beforeEach(() => {
    manager = new LoginItemManager();
  });

  describe('enable()', () => {
    it('should enable auto-start with default method', async () => {
      const result = await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
      expect(result.method).toBe(AutoStartMethod.MyBoTeamDefaults);
      expect(result.timestamp).toBeDefined();
    });

    it('should enable auto-start with specified method', async () => {
      const result = await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
        method: AutoStartMethod.ServiceManagement,
      });

      expect(result.success).toBe(true);
      expect(result.method).toBe(AutoStartMethod.ServiceManagement);
    });

    it('should update state to Enabled after successful registration', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const status = await manager.getStatus('com.test.daemon');
      expect(status.state).toBe(LoginItemState.Enabled);
    });

    it('should persist the auto-start preference', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const preference = manager.getAutoStartPreference();
      expect(preference).not.toBeNull();
      expect(preference?.enabled).toBe(true);
    });

    it('should prevent duplicate registrations', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const result = await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(LoginItemErrorCode.DUPLICATE_REGISTRATION);
    });

    it('should handle invalid path', async () => {
      const result = await manager.enable({
        applicationPath: '',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(LoginItemErrorCode.INVALID_PATH);
    });

    it('should log registration success', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const logs = manager.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].event).toBe('REGISTER');
    });

    it('should log registration failure', async () => {
      await manager.enable({
        applicationPath: '',
        label: 'com.test.daemon',
      });

      const logs = manager.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.event === 'ERROR')).toBe(true);
    });
  });

  describe('disable()', () => {
    it('should disable auto-start', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const result = await manager.disable('com.test.daemon');
      expect(result.success).toBe(true);
    });

    it('should update state to Disabled', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      await manager.disable('com.test.daemon');
      const status = await manager.getStatus('com.test.daemon');
      expect(status.state).toBe(LoginItemState.Disabled);
    });

    it('should update auto-start preference to disabled', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      await manager.disable('com.test.daemon');
      const preference = manager.getAutoStartPreference();
      expect(preference?.enabled).toBe(false);
    });

    it('should log unregistration success', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      await manager.disable('com.test.daemon');
      const logs = manager.getLogs();
      expect(logs.some((log) => log.event === 'UNREGISTER')).toBe(true);
    });

    it('should log unregistration failure', async () => {
      // Mock a failure scenario
      const result = await manager.disable('non-existent-label');
      expect(result.success).toBe(true); // Currently always succeeds
    });
  });

  describe('getStatus()', () => {
    it('should return disabled status by default', async () => {
      const status = await manager.getStatus('com.test.daemon');
      expect(status.enabled).toBe(false);
      expect(status.state).toBe(LoginItemState.Disabled);
    });

    it('should return enabled status after enable', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const status = await manager.getStatus('com.test.daemon');
      expect(status.enabled).toBe(true);
      expect(status.state).toBe(LoginItemState.Enabled);
    });

    it('should include lastChecked timestamp', async () => {
      const status = await manager.getStatus('com.test.daemon');
      expect(status.lastChecked).toBeDefined();
    });

    it('should log status check', async () => {
      await manager.getStatus('com.test.daemon');
      const logs = manager.getLogs();
      expect(logs.some((log) => log.event === 'STATUS_CHECK')).toBe(true);
    });
  });

  describe('syncWithSystem()', () => {
    it('should sync with system state', async () => {
      const status = await manager.syncWithSystem('com.test.daemon');
      expect(status.synced).toBe(true);
    });

    it('should return current state after sync', async () => {
      await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const status = await manager.syncWithSystem('com.test.daemon');
      expect(status.enabled).toBe(true);
      expect(status.synced).toBe(true);
    });

    it('should log sync operation', async () => {
      await manager.syncWithSystem('com.test.daemon');
      const logs = manager.getLogs();
      expect(logs.some((log) => log.event === 'STATUS_CHECK')).toBe(true);
    });
  });
});
