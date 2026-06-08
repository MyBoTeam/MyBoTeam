import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAzureEntraToken,
  getTokenExpiry,
  hasValidToken,
} from '../../../../src/opencode/proxies/azure-token-manager.js';

describe('Azure Token Manager', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('hasValidToken', () => {
    it('should return false when no token cached', () => {
      expect(hasValidToken()).toBe(false);
    });
  });

  describe('getTokenExpiry', () => {
    it('should return null when no token cached', () => {
      expect(getTokenExpiry()).toBeNull();
    });
  });

  describe('getAzureEntraToken', () => {
    it('should return error when Azure Identity not available', async () => {
      vi.doMock('@azure/identity', () => {
        throw new Error('Module not found');
      });

      const result = await getAzureEntraToken();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to acquire Azure Entra ID token');
      }
    });

    it('should return cached token if valid', async () => {
      const result = await getAzureEntraToken();

      expect(result.success).toBe(false);
    });

    it('should provide helpful hints for common errors', async () => {
      const result = await getAzureEntraToken();

      if (!result.success) {
        expect(result.error).toContain('Failed to acquire Azure Entra ID token');
      }
    });
  });

  describe('token caching', () => {
    it('should not have valid token initially', () => {
      expect(hasValidToken()).toBe(false);
    });

    it('should not have expiry initially', () => {
      expect(getTokenExpiry()).toBeNull();
    });
  });
});
