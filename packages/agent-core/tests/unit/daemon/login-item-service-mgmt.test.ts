/**
 * Unit tests for Service Management fallback
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { LoginItemServiceMgmt } from '../../../src/daemon/login-item-service-mgmt.js';
import { AutoStartMethod } from '../../../src/types/login-item.js';

describe('LoginItemServiceMgmt', () => {
  let serviceMgmt: LoginItemServiceMgmt;

  beforeEach(() => {
    serviceMgmt = new LoginItemServiceMgmt();
  });

  describe('register()', () => {
    it('should register a login item using Service Management framework', async () => {
      const result = await serviceMgmt.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
      expect(result.method).toBe(AutoStartMethod.ServiceManagement);
    });

    it('should handle registration with valid path', async () => {
      const result = await serviceMgmt.register({
        applicationPath: '/Applications/MyApp.app/Contents/MacOS/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
    });

    it('should fail with empty path', async () => {
      const result = await serviceMgmt.register({
        applicationPath: '',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('unregister()', () => {
    it('should unregister a login item', async () => {
      await serviceMgmt.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const result = await serviceMgmt.unregister('com.test.daemon');
      expect(result.success).toBe(true);
    });

    it('should handle unregistering non-existent item', async () => {
      const result = await serviceMgmt.unregister('com.nonexistent.daemon');
      expect(result.success).toBe(true);
    });
  });

  describe('isRegistered()', () => {
    it('should return true after registration', async () => {
      await serviceMgmt.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const registered = await serviceMgmt.isRegistered('com.test.daemon');
      expect(registered).toBe(true);
    });

    it('should return false after unregistration', async () => {
      await serviceMgmt.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });
      await serviceMgmt.unregister('com.test.daemon');

      const registered = await serviceMgmt.isRegistered('com.test.daemon');
      expect(registered).toBe(false);
    });

    it('should return false for non-existent item', async () => {
      const registered = await serviceMgmt.isRegistered('com.nonexistent.daemon');
      expect(registered).toBe(false);
    });
  });
});
