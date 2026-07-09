/**
 * Unit tests for CustomProviderService.
 * Tests API key encryption via vault, API key masking, and provider count limits.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomProviderService } from '../../../src/providers/custom-config.js';
import type { CreateProviderRequest } from '@myboteam/types';
import { maskApiKey } from '../../../src/providers/tools/custom-utils.js';
import type { VaultService } from '../../../src/vault/vault-service.js';
import type { VaultEntry } from '../../../src/vault/vault-types.js';

function createMockVault(): VaultService {
  return {
    store_entry: vi.fn().mockResolvedValue({} as VaultEntry),
    retrieve: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({} as VaultEntry),
    delete: vi.fn().mockResolvedValue(true),
    list: vi.fn().mockResolvedValue([]),
    decrypt: vi.fn().mockResolvedValue(''),
    unlock: vi.fn().mockResolvedValue(undefined),
    lock: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue({} as VaultEntry),
    onRefreshFailure: vi.fn(),
  } as unknown as VaultService;
}

function createMockVaultEntry(
  providerId: string,
  metadata: Record<string, unknown> = {},
): VaultEntry {
  return {
    id: 'test-id',
    key: `custom-provider:${providerId}`,
    type: 'api_key',
    encryptedValue: 'encrypted-value',
    iv: 'iv',
    salt: 'salt',
    tag: 'tag',
    state: 'active',
    metadata: {
      name: 'Test Provider',
      url: 'https://api.example.com/v1',
      modelName: 'gpt-4',
      status: 'Active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      lastTestedAt: null,
      testResult: null,
      ...metadata,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('CustomProviderService', () => {
  let vault: VaultService;
  let service: CustomProviderService;

  beforeEach(() => {
    vault = createMockVault();
    service = new CustomProviderService(vault);
  });

  describe('API Key Encryption', () => {
    it('should store API key encrypted via vault store_entry', async () => {
      const request: CreateProviderRequest = {
        name: 'My Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-secret-api-key-123',
        modelName: 'gpt-4',
      };

      await service.createProvider(request);

      expect(vault.store_entry).toHaveBeenCalledOnce();
      const [key, value, type, metadata] = (vault.store_entry as any).mock.calls[0];

      expect(key).toMatch(/^custom-provider:/);
      expect(value).toBe('sk-secret-api-key-123');
      expect(type).toBe('api_key');
      expect(metadata).toHaveProperty('name', 'My Provider');
      expect(metadata).toHaveProperty('url', 'https://api.example.com/v1');
      expect(metadata).toHaveProperty('modelName', 'gpt-4');
    });

    it('should store empty string when API key is not provided', async () => {
      const request: CreateProviderRequest = {
        name: 'Public Provider',
        url: 'https://api.example.com/v1',
        modelName: 'llama-3',
      };

      await service.createProvider(request);

      const [, value] = (vault.store_entry as any).mock.calls[0];
      expect(value).toBe('__NO_API_KEY__');
    });

    it('should generate unique vault key for each provider', async () => {
      const request1: CreateProviderRequest = {
        name: 'Provider 1',
        url: 'https://api1.example.com/v1',
        apiKey: 'key1',
        modelName: 'gpt-4',
      };
      const request2: CreateProviderRequest = {
        name: 'Provider 2',
        url: 'https://api2.example.com/v1',
        apiKey: 'key2',
        modelName: 'gpt-4',
      };

      await service.createProvider(request1);
      await service.createProvider(request2);

      const key1 = (vault.store_entry as any).mock.calls[0][0];
      const key2 = (vault.store_entry as any).mock.calls[1][0];
      expect(key1).not.toBe(key2);
    });
  });

  describe('API Key Masking', () => {
    it('should return apiKey as null in createProvider response', async () => {
      const request: CreateProviderRequest = {
        name: 'My Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-secret-api-key-123',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
      expect(result.provider?.apiKey).toBeNull();
    });

    it('should return apiKey as null in getProvider response', async () => {
      const providerId = 'test-provider-id';
      const entry = createMockVaultEntry('sk-secret-api-key-123');
      (vault.retrieve as any).mockResolvedValue(entry);

      const result = await service.getProvider({ providerId });

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
      expect(result.provider?.apiKey).toBeNull();
    });

    it('should never include actual API key in response even when vault contains it', async () => {
      const request: CreateProviderRequest = {
        name: 'My Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-super-secret-key',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);

      expect(result.provider?.apiKey).toBeNull();
      expect(JSON.stringify(result)).not.toContain('sk-super-secret-key');
    });
  });

  describe('Provider Count Limit', () => {
    it('should allow creating provider when under limit', async () => {
      (vault.list as any).mockResolvedValue([]);

      const request: CreateProviderRequest = {
        name: 'My Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-test',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);
      expect(result.success).toBe(true);
    });

    it('should reject creating provider when at limit (50)', async () => {
      const providers = Array.from({ length: 50 }, (_, i) =>
        createMockVaultEntry(`key-${i}`, { name: `Provider ${i}` }),
      );
      (vault.list as any).mockResolvedValue(providers);

      const request: CreateProviderRequest = {
        name: 'Provider 51',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-test',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('limit');
      expect(result.error).toContain('50');
    });

    it('should allow creating provider after deleting one when at limit', async () => {
      const providers = Array.from({ length: 49 }, (_, i) =>
        createMockVaultEntry(`provider-${i}`, {
          name: `Provider ${i}`,
          url: `https://api${i}.example.com/v1`,
        }),
      );
      (vault.list as any).mockResolvedValue(providers);

      const request: CreateProviderRequest = {
        name: 'New Provider',
        url: 'https://api.new.example.com/v1',
        apiKey: 'sk-test',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);
      expect(result.success).toBe(true);
    });
  });

  describe('maskApiKey', () => {
    it('should mask long API keys as first4****last4', () => {
      expect(maskApiKey('sk-12345678901234567890')).toBe('sk-1****7890');
    });

    it('should mask short API keys as ****', () => {
      expect(maskApiKey('short')).toBe('****');
      expect(maskApiKey('12345678')).toBe('****');
    });

    it('should handle undefined API key', () => {
      expect(maskApiKey(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(maskApiKey('')).toBe('');
    });
  });
});
