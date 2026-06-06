import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDaemonCall = vi.fn();

vi.mock('@main/daemon/daemon-lifecycle', () => ({
  getDaemonClient: vi.fn(() => ({ call: mockDaemonCall })),
}));

import {
  clearSecureStorage,
  deleteApiKey,
  getAllApiKeys,
  getApiKey,
  getBedrockCredentials,
  hasAnyApiKey,
  storeApiKey,
  storeBedrockCredentials,
} from '@main/store/secureStorage';

describe('secureStorage (daemon RPC facade)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeApiKey', () => {
    it('should call secrets.storeApiKey RPC', async () => {
      await storeApiKey('openai', 'sk-test');
      expect(mockDaemonCall).toHaveBeenCalledWith('secrets.storeApiKey', {
        provider: 'openai',
        apiKey: 'sk-test',
      });
    });
  });

  describe('getApiKey', () => {
    it('should call secrets.getApiKey RPC and return key', async () => {
      mockDaemonCall.mockResolvedValueOnce('sk-test');
      const result = await getApiKey('openai');
      expect(mockDaemonCall).toHaveBeenCalledWith('secrets.getApiKey', { provider: 'openai' });
      expect(result).toBe('sk-test');
    });

    it('should return null when no key exists', async () => {
      mockDaemonCall.mockResolvedValueOnce(null);
      const result = await getApiKey('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteApiKey', () => {
    it('should call secrets.deleteApiKey RPC', async () => {
      mockDaemonCall.mockResolvedValueOnce(true);
      const result = await deleteApiKey('openai');
      expect(mockDaemonCall).toHaveBeenCalledWith('secrets.deleteApiKey', { provider: 'openai' });
      expect(result).toBe(true);
    });
  });

  describe('getAllApiKeys', () => {
    it('should call secrets.getAllApiKeys RPC', async () => {
      mockDaemonCall.mockResolvedValueOnce({ openai: 'sk-test', anthropic: 'sk-ant' });
      const result = await getAllApiKeys();
      expect(mockDaemonCall).toHaveBeenCalledWith('secrets.getAllApiKeys');
      expect(result).toEqual({ openai: 'sk-test', anthropic: 'sk-ant' });
    });
  });

  describe('getBedrockCredentials', () => {
    it('should call secrets.getBedrockCredentials RPC', async () => {
      mockDaemonCall.mockResolvedValueOnce({ accessKeyId: 'AKI...', secretAccessKey: '...' });
      const result = await getBedrockCredentials();
      expect(mockDaemonCall).toHaveBeenCalledWith('secrets.getBedrockCredentials');
      expect(result).toEqual({ accessKeyId: 'AKI...', secretAccessKey: '...' });
    });
  });

  describe('storeBedrockCredentials', () => {
    it('should call secrets.storeBedrockCredentials RPC', async () => {
      await storeBedrockCredentials('creds-json');
      expect(mockDaemonCall).toHaveBeenCalledWith('secrets.storeBedrockCredentials', {
        credentials: 'creds-json',
      });
    });
  });

  describe('hasAnyApiKey', () => {
    it('should return true when keys exist', async () => {
      mockDaemonCall.mockResolvedValueOnce(true);
      const result = await hasAnyApiKey();
      expect(mockDaemonCall).toHaveBeenCalledWith('secrets.hasAnyApiKey');
      expect(result).toBe(true);
    });

    it('should return false when no keys exist', async () => {
      mockDaemonCall.mockResolvedValueOnce(false);
      const result = await hasAnyApiKey();
      expect(result).toBe(false);
    });
  });

  describe('clearSecureStorage', () => {
    it('should be a no-op (intentionally empty)', () => {
      expect(clearSecureStorage()).toBeUndefined();
      expect(mockDaemonCall).not.toHaveBeenCalled();
    });
  });
});
