import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BYOKInjector } from '../../../src/providers/byok-injector.js';
import type { ProviderConfig } from '../../../src/providers/tools/provider-config.js';
import type { VaultService } from '../../../src/vault/vault-service.js';

function createMockVault(overrides?: Partial<VaultService>): VaultService {
  return {
    decrypt: vi.fn().mockResolvedValue('decrypted-key-123'),
    encrypt: vi.fn(),
    retrieve: vi.fn(),
    store_entry: vi.fn(),
    delete_entry: vi.fn(),
    list_entries: vi.fn(),
    ...overrides,
  } as unknown as VaultService;
}

function createMockConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return {
    apiKey: 'encrypted-key',
    baseUrl: 'https://api.example.com',
    defaultModel: 'gpt-4',
    ...overrides,
  };
}

describe('BYOKInjector', () => {
  let vault: VaultService;
  let injector: BYOKInjector;

  beforeEach(() => {
    vault = createMockVault();
    injector = new BYOKInjector(vault);
  });

  describe('decryptApiKey', () => {
    it('should decrypt API key from vault', async () => {
      const result = await injector.decryptApiKey('encrypted-key');

      expect(result.injected).toBe(true);
      expect(result.apiKey).toBe('decrypted-key-123');
      expect(vault.decrypt).toHaveBeenCalledWith({
        encryptedValue: 'encrypted-key',
        iv: '',
        salt: '',
        tag: '',
        key: '',
        type: 'api_key',
        id: '',
        state: 'active',
        metadata: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle vault locked error', async () => {
      vault = createMockVault({
        decrypt: vi.fn().mockRejectedValue(new Error('Vault is locked')),
      });
      injector = new BYOKInjector(vault);

      const result = await injector.decryptApiKey('encrypted-key');

      expect(result.injected).toBe(false);
      expect(result.warning).toBe('Vault is locked');
    });

    it('should handle decryption failure', async () => {
      vault = createMockVault({
        decrypt: vi.fn().mockRejectedValue(new Error('Invalid key')),
      });
      injector = new BYOKInjector(vault);

      const result = await injector.decryptApiKey('encrypted-key');

      expect(result.injected).toBe(false);
      expect(result.warning).toContain('Decryption failed');
    });
  });

  describe('maskKey', () => {
    it('should mask API key showing first 4 and last 4 characters', () => {
      const masked = injector.maskKey('sk-1234567890abcdef');
      expect(masked).toMatch(/^sk-1\*{4}cdef$/);
    });

    it('should handle short keys', () => {
      const masked = injector.maskKey('abc');
      expect(masked).toBe('****');
    });

    it('should handle undefined key', () => {
      const masked = injector.maskKey(undefined);
      expect(masked).toBe('');
    });

    it('should generate different masked values for different keys', () => {
      const key1 = 'sk-real-key-1234567890';
      const key2 = 'sk-real-key-0987654321';

      const masked1 = injector.maskKey(key1);
      const masked2 = injector.maskKey(key2);

      expect(masked1).not.toBe(masked2);
    });
  });

  describe('inject', () => {
    it('should inject decrypted BYOK key into config', async () => {
      const config = createMockConfig();

      const result = await injector.inject(config, 'encrypted-key');

      expect(result.config.apiKey).toBe('decrypted-key-123');
      expect(result.warning).toBeUndefined();
      expect(vault.decrypt).toHaveBeenCalled();
    });

    it('should preserve other config fields', async () => {
      const config = createMockConfig({
        baseUrl: 'https://custom.api.com',
        defaultModel: 'claude-3',
      });

      const result = await injector.inject(config, 'encrypted-key');

      expect(result.config.apiKey).toBe('decrypted-key-123');
      expect(result.config.baseUrl).toBe('https://custom.api.com');
      expect(result.config.defaultModel).toBe('claude-3');
    });

    it('should return warning when vault is locked', async () => {
      vault = createMockVault({
        decrypt: vi.fn().mockRejectedValue(new Error('Vault is locked')),
      });
      injector = new BYOKInjector(vault);

      const config = createMockConfig();
      const result = await injector.inject(config, 'encrypted-key');

      expect(result.config).toBe(config);
      expect(result.warning).toBe('Vault is locked');
    });

    it('should return warning on decryption failure', async () => {
      vault = createMockVault({
        decrypt: vi.fn().mockRejectedValue(new Error('Invalid key')),
      });
      injector = new BYOKInjector(vault);

      const config = createMockConfig();
      const result = await injector.inject(config, 'encrypted-key');

      expect(result.config).toBe(config);
      expect(result.warning).toContain('Decryption failed');
    });

    it('should not persist decrypted key beyond injection', async () => {
      const config = createMockConfig();

      const result1 = await injector.inject(config, 'encrypted-key');
      const result2 = await injector.inject(config, 'encrypted-key');

      expect(result1.config.apiKey).toBe('decrypted-key-123');
      expect(result2.config.apiKey).toBe('decrypted-key-123');
      expect(vault.decrypt).toHaveBeenCalledTimes(2);
    });
  });

  describe('resolveProviderClient', () => {
    it('should return client as-is when no BYOK key provided', async () => {
      const mockClient = { chatCompletion: vi.fn(), streamChat: vi.fn(), listModels: vi.fn() };

      const result = await injector.resolveProviderClient(mockClient);

      expect(result.client).toBe(mockClient);
      expect(result.warning).toBeUndefined();
    });

    it('should decrypt and return client with BYOK key', async () => {
      const mockClient = { chatCompletion: vi.fn(), streamChat: vi.fn(), listModels: vi.fn() };

      const result = await injector.resolveProviderClient(mockClient, 'encrypted-key');

      expect(result.client).toBe(mockClient);
      expect(result.warning).toBeUndefined();
      expect(vault.decrypt).toHaveBeenCalled();
    });

    it('should return warning when vault is locked', async () => {
      vault = createMockVault({
        decrypt: vi.fn().mockRejectedValue(new Error('Vault is locked')),
      });
      injector = new BYOKInjector(vault);

      const mockClient = { chatCompletion: vi.fn(), streamChat: vi.fn(), listModels: vi.fn() };

      const result = await injector.resolveProviderClient(mockClient, 'encrypted-key');

      expect(result.client).toBe(mockClient);
      expect(result.warning).toBe('Vault is locked');
    });

    it('should return warning on general decryption failure', async () => {
      vault = createMockVault({
        decrypt: vi.fn().mockRejectedValue(new Error('Invalid key')),
      });
      injector = new BYOKInjector(vault);

      const mockClient = { chatCompletion: vi.fn(), streamChat: vi.fn(), listModels: vi.fn() };

      const result = await injector.resolveProviderClient(mockClient, 'encrypted-key');

      expect(result.client).toBe(mockClient);
      expect(result.warning).toContain('Decryption failed');
    });
  });
});
