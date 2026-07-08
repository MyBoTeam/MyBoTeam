import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateProviderRequest, TestConnectionRequest } from '../../../src/index.js';
import type { VaultService } from '../../../src/vault/vault-service.js';
import { CustomProviderService } from '../../../src/providers/custom-config.js';

function createMockVault(): VaultService {
  return {
    store_entry: vi.fn().mockResolvedValue(undefined),
    retrieve: vi.fn().mockResolvedValue(null),
    delete_entry: vi.fn().mockResolvedValue(undefined),
    list_entries: vi.fn().mockResolvedValue([]),
  } as unknown as VaultService;
}

describe('Custom Provider Contract', () => {
  let service: CustomProviderService;
  let mockVault: VaultService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVault = createMockVault();
    service = new CustomProviderService(mockVault);
  });

  describe('CreateProvider contract', () => {
    it('should accept valid request and return provider', async () => {
      const request: CreateProviderRequest = {
        name: 'My Custom Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-test-12345',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
      expect(result.provider?.name).toBe('My Custom Provider');
      expect(result.provider?.url).toBe('https://api.example.com/v1');
      expect(result.provider?.modelName).toBe('gpt-4');
      expect(result.provider?.status).toBe('Active');
      expect(result.provider?.id).toBeDefined();
      expect(result.provider?.apiKey).toBeNull();
    });

    it('should accept request without optional apiKey', async () => {
      const request: CreateProviderRequest = {
        name: 'Public Provider',
        url: 'https://api.example.com/v1',
        modelName: 'llama-3',
      };

      const result = await service.createProvider(request);

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
      expect(result.provider?.name).toBe('Public Provider');
      expect(result.provider?.apiKey).toBeNull();
    });

    it('should store API key in vault', async () => {
      const request: CreateProviderRequest = {
        name: 'Secure Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'secret-key-123',
        modelName: 'gpt-4',
      };

      await service.createProvider(request);

      expect(mockVault.store_entry).toHaveBeenCalledOnce();
      const callArgs = (mockVault.store_entry as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toMatch(/^custom-provider:/);
      expect(callArgs[1]).toBe('secret-key-123');
      expect(callArgs[2]).toBe('api_key');
    });

    it('should return error for invalid URL', async () => {
      const request: CreateProviderRequest = {
        name: 'Bad URL Provider',
        url: 'not-a-url',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('INVALID_URL');
    });

    it('should return error for empty name', async () => {
      const request: CreateProviderRequest = {
        name: '',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for empty modelName', async () => {
      const request: CreateProviderRequest = {
        name: 'Empty Model',
        url: 'https://api.example.com/v1',
        modelName: '',
      };

      const result = await service.createProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when vault store fails', async () => {
      (mockVault.store_entry as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Vault unavailable'),
      );

      const request: CreateProviderRequest = {
        name: 'Vault Error Provider',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      };

      const result = await service.createProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vault unavailable');
    });
  });

  describe('TestConnection contract', () => {
    it.skip('should accept TestConnectionRequest and return result', async () => {
      const request: TestConnectionRequest = {
        providerId: 'test-provider-id',
      };

      // TestConnection not yet implemented
    });

    it.skip('should return error for non-existent provider', async () => {
      const request: TestConnectionRequest = {
        providerId: 'non-existent-id',
      };

      // TestConnection not yet implemented
    });

    it.skip('should accept optional timeout parameter', async () => {
      const request: TestConnectionRequest = {
        providerId: 'test-provider-id',
        timeout: 5000,
      };

      // TestConnection not yet implemented
    });
  });
});
