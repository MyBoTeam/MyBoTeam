/**
 * Edge case tests for error scenarios
 * Feature: M3.4 Login Item Auto-Start
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { LoginItemError, RetryHandler } from '../../../src/daemon/login-item-errors.js';
import { LoginItemManager } from '../../../src/daemon/login-item-manager.js';
import { LoginItemPersistence } from '../../../src/daemon/login-item-persistence.js';
import { LoginItemErrorCode } from '../../../src/types/login-item.js';

describe('Edge Case Error Scenarios', () => {
  let manager: LoginItemManager;

  beforeEach(() => {
    new LoginItemPersistence().clear();
    manager = new LoginItemManager();
  });

  describe('error handling', () => {
    it('should handle empty path', async () => {
      const result = await manager.enable({
        applicationPath: '',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(LoginItemErrorCode.INVALID_PATH);
    });

    it('should handle relative path', async () => {
      const result = await manager.enable({
        applicationPath: 'relative/path/daemon',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(LoginItemErrorCode.INVALID_PATH);
    });

    it('should handle invalid characters in path', async () => {
      const result = await manager.enable({
        applicationPath: '/path/with<invalid>chars',
        label: 'com.test.daemon',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(LoginItemErrorCode.INVALID_PATH);
    });

    it('should handle empty label', async () => {
      const result = await manager.enable({
        applicationPath: '/usr/local/bin/daemon',
        label: '',
      });

      expect(result.success).toBe(false);
    });

    it('should handle duplicate registration', async () => {
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
  });

  describe('retry handler', () => {
    it('should retry on failure', async () => {
      const retryHandler = new RetryHandler(2, 100);
      let attempts = 0;

      const result = await retryHandler.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const retryHandler = new RetryHandler(1, 100);

      await expect(
        retryHandler.execute(async () => {
          throw new Error('Permanent failure');
        }),
      ).rejects.toThrow();
    });
  });

  describe('LoginItemError', () => {
    it('should create user-friendly error message', () => {
      const error = new LoginItemError(
        'Registration failed',
        LoginItemErrorCode.REGISTRATION_FAILED,
      );

      expect(error.toUserMessage()).toContain('System Preferences');
    });

    it('should provide manual setup instructions', () => {
      const error = new LoginItemError(
        'Registration failed',
        LoginItemErrorCode.REGISTRATION_FAILED,
      );

      const instructions = error.getManualSetupInstructions();
      expect(instructions).toContain('System Preferences');
      expect(instructions).toContain('Login Items');
    });
  });
});
