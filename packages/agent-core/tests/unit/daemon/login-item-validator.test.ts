/**
 * Unit tests for path validation
 * Feature: M3.4 Login Item Auto-Start
 */

import { describe, expect, it } from 'vitest';
import { validateLabel, validatePath } from '../../src/daemon/login-item-validator.js';

describe('LoginItemValidator', () => {
  describe('validatePath()', () => {
    it('should validate a valid absolute path', () => {
      const result = validatePath('/usr/local/bin/daemon');
      expect(result.valid).toBe(true);
    });

    it('should validate a path with spaces', () => {
      const result = validatePath('/Applications/My App.app/Contents/MacOS/daemon');
      expect(result.valid).toBe(true);
    });

    it('should reject an empty path', () => {
      const result = validatePath('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject a relative path', () => {
      const result = validatePath('./daemon');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('absolute');
    });

    it('should reject a path with invalid characters', () => {
      const result = validatePath('/path/with<invalid>chars');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should validate a path with .app extension', () => {
      const result = validatePath('/Applications/MyApp.app');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateLabel()', () => {
    it('should validate a valid label', () => {
      const result = validateLabel('com.test.daemon');
      expect(result.valid).toBe(true);
    });

    it('should reject an empty label', () => {
      const result = validateLabel('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject a label with invalid characters', () => {
      const result = validateLabel('com test daemon');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    it('should validate a label with hyphens', () => {
      const result = validateLabel('com-test-daemon');
      expect(result.valid).toBe(true);
    });

    it('should validate a label with underscores', () => {
      const result = validateLabel('com_test_daemon');
      expect(result.valid).toBe(true);
    });
  });
});
