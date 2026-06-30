/**
 * System integration test for macOS compatibility
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { LoginItemPersistence } from '../../../src/daemon/login-item-persistence.js';
import { AutoStartService } from '../../../src/services/auto-start-service.js';

describe('macOS Compatibility Integration', () => {
  let service: AutoStartService;

  beforeEach(() => {
    new LoginItemPersistence().clear();
    service = new AutoStartService();
  });

  describe('macOS compatibility', () => {
    it('should work with macOS-style paths', async () => {
      const result = await service.enable({
        applicationPath: '/Applications/MyApp.app/Contents/MacOS/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
    });

    it('should handle paths with spaces', async () => {
      const result = await service.enable({
        applicationPath: '/Applications/My App.app/Contents/MacOS/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
    });

    it('should handle user home directory paths', async () => {
      const result = await service.enable({
        applicationPath: '/Users/testuser/.local/bin/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(true);
    });

    it('should validate path format for macOS', async () => {
      const result = await service.enable({
        applicationPath: 'relative/path/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
    });
  });
});
