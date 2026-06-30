/**
 * Unit tests for login item registration handler
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { LoginItemRegistration } from '../../../src/daemon/login-item-registration.js';
import { AutoStartMethod } from '../../../src/types/login-item.js';

describe('LoginItemRegistration', () => {
  let registration: LoginItemRegistration;

  beforeEach(() => {
    registration = new LoginItemRegistration();
  });

  describe('register()', () => {
    it('should register a login item', async () => {
      const result = await registration.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
      expect(result.method).toBe(AutoStartMethod.MyBoTeamDefaults);
    });

    it('should handle registration with valid path', async () => {
      const result = await registration.register({
        applicationPath: '/Applications/MyApp.app/Contents/MacOS/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
    });

    it('should fail with empty path', async () => {
      const result = await registration.register({
        applicationPath: '',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('unregister()', () => {
    it('should unregister a login item', async () => {
      await registration.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const result = await registration.unregister('com.test.daemon');
      expect(result.success).toBe(true);
    });

    it('should handle unregistering non-existent item', async () => {
      const result = await registration.unregister('com.nonexistent.daemon');
      expect(result.success).toBe(true);
    });
  });

  describe('isRegistered()', () => {
    it('should return true after registration', async () => {
      await registration.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });

      const registered = await registration.isRegistered('com.test.daemon');
      expect(registered).toBe(true);
    });

    it('should return false after unregistration', async () => {
      await registration.register({
        applicationPath: '/usr/local/bin/daemon',
        label: 'com.test.daemon',
      });
      await registration.unregister('com.test.daemon');

      const registered = await registration.isRegistered('com.test.daemon');
      expect(registered).toBe(false);
    });

    it('should return false for non-existent item', async () => {
      const registered = await registration.isRegistered('com.nonexistent.daemon');
      expect(registered).toBe(false);
    });
  });
});
