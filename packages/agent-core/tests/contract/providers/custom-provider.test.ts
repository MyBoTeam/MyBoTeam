import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CreateProviderRequest,
  DeleteProviderRequest,
  ListProvidersRequest,
  UpdateProviderRequest,
} from '../../../src/index.js';
import { CustomProviderService } from '../../../src/providers/custom-config.js';
import type { VaultService } from '../../../src/vault/vault-service.js';

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

function createMockVault(): VaultService {
  return {
    store_entry: vi.fn().mockResolvedValue(undefined),
    retrieve: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
    list: vi.fn().mockResolvedValue([]),
    decrypt: vi.fn().mockResolvedValue(''),
    lock: vi.fn().mockResolvedValue(undefined),
    unlock: vi.fn().mockResolvedValue(undefined),
  } as unknown as VaultService;
}

describe('Custom Provider Contract', () => {
  let service: CustomProviderService;
  let mockVault: VaultService;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockVault = createMockVault();
    service = new CustomProviderService(mockVault);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
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
      expect(result.provider?.createdAt).toBeInstanceOf(Date);
      expect(result.provider?.updatedAt).toBeInstanceOf(Date);
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

    it('should store API key in vault with correct metadata', async () => {
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
      expect(callArgs[3]).toMatchObject({
        name: 'Secure Provider',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
        status: 'Active',
      });
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
      expect(result.error).toContain('VALIDATION_FAILED');
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
      expect(result.error).toContain('VALIDATION_FAILED');
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

  describe('GetProvider contract', () => {
    it('should return provider when found in vault', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getProvider({ providerId });

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
      expect(result.provider?.id).toBe(providerId);
      expect(result.provider?.name).toBe('Test Provider');
      expect(result.provider?.url).toBe('https://api.example.com/v1');
      expect(result.provider?.modelName).toBe('gpt-4');
      expect(result.provider?.status).toBe('Active');
      expect(result.provider?.apiKey).toBeNull();
      expect(result.provider?.createdAt).toBeInstanceOf(Date);
      expect(result.provider?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return error when provider not found', async () => {
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.getProvider({ providerId: 'non-existent' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error when vault retrieve fails', async () => {
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Vault unavailable'),
      );

      const result = await service.getProvider({ providerId: 'test-id' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vault unavailable');
    });
  });

  describe('TestConnection contract', () => {
    it('should accept TestConnectionRequest and return result', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'gpt-4', object: 'model', created: 1686935002, owned_by: 'openai' },
            { id: 'gpt-3.5-turbo', object: 'model', created: 1686935002, owned_by: 'openai' },
          ],
        }),
      });

      const result = await service.testConnection({ providerId });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.providerId).toBe(providerId);
      expect(result.result?.success).toBe(true);
      expect(result.result?.testedAt).toBeDefined();
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('should return error for non-existent provider', async () => {
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.testConnection({ providerId: 'non-existent' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should accept optional timeout parameter', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (mockVault.decrypt as ReturnType<typeof vi.fn>).mockResolvedValue('sk-test-key');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'gpt-4', object: 'model', created: 1686935002, owned_by: 'openai' },
            { id: 'gpt-3.5-turbo', object: 'model', created: 1686935002, owned_by: 'openai' },
          ],
        }),
      });

      const result = await service.testConnection({ providerId, timeout: 5000 });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.success).toBe(true);
    });

    it('should handle HTTP errors', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (mockVault.decrypt as ReturnType<typeof vi.fn>).mockResolvedValue('sk-test-key');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await service.testConnection({ providerId });

      expect(result.success).toBe(true);
      expect(result.result?.success).toBe(false);
      expect(result.result?.error).toContain('401');
    });
  });

  describe('UpdateProvider contract', () => {
    it('should accept valid request and return updated provider', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      const existingEntry = {
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(existingEntry);
      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([existingEntry]);
      (mockVault.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...existingEntry,
        metadata: {
          ...existingEntry.metadata,
          name: 'Updated Provider',
          modelName: 'gpt-4-turbo',
          updatedAt: new Date().toISOString(),
        },
      });

      const request: UpdateProviderRequest = {
        providerId,
        name: 'Updated Provider',
        modelName: 'gpt-4-turbo',
      };

      const result = await service.updateProvider(request);

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
      expect(result.provider?.id).toBe(providerId);
      expect(result.provider?.name).toBe('Updated Provider');
      expect(result.provider?.modelName).toBe('gpt-4-turbo');
    });

    it('should return error when provider not found', async () => {
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request: UpdateProviderRequest = {
        providerId: 'non-existent',
        name: 'Updated Name',
      };

      const result = await service.updateProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject duplicate name', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      const existingEntry = {
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherEntry = {
        ...existingEntry,
        id: 'vault-entry-id-2',
        key: 'custom-provider:other-provider',
        metadata: {
          ...existingEntry.metadata,
          name: 'Existing Name',
        },
      };

      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(existingEntry);
      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([existingEntry, otherEntry]);

      const request: UpdateProviderRequest = {
        providerId,
        name: 'Existing Name',
      };

      const result = await service.updateProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PROVIDER_NAME_EXISTS');
    });

    it('should reject duplicate URL', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      const existingEntry = {
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherEntry = {
        ...existingEntry,
        id: 'vault-entry-id-2',
        key: 'custom-provider:other-provider',
        metadata: {
          ...existingEntry.metadata,
          name: 'Other Provider',
          url: 'https://api.other.com/v1',
        },
      };

      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(existingEntry);
      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([existingEntry, otherEntry]);

      const request: UpdateProviderRequest = {
        providerId,
        url: 'https://api.other.com/v1',
      };

      const result = await service.updateProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PROVIDER_URL_EXISTS');
    });

    it('should reject invalid URL', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      const existingEntry = {
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(existingEntry);
      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([existingEntry]);

      const request: UpdateProviderRequest = {
        providerId,
        url: 'not-a-url',
      };

      const result = await service.updateProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('INVALID_URL');
    });

    it('should update API key in vault', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      const existingEntry = {
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(existingEntry);
      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([existingEntry]);
      (mockVault.update as ReturnType<typeof vi.fn>).mockResolvedValue(existingEntry);

      const request: UpdateProviderRequest = {
        providerId,
        apiKey: 'new-api-key-456',
      };

      await service.updateProvider(request);

      expect(mockVault.update).toHaveBeenCalledOnce();
      const callArgs = (mockVault.update as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[1]).toBe('new-api-key-456');
    });
  });

  describe('DeleteProvider contract', () => {
    it('should soft delete provider (mark as inactive)', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      const existingEntry = {
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(existingEntry);
      (mockVault.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...existingEntry,
        metadata: {
          ...existingEntry.metadata,
          status: 'Inactive',
          updatedAt: new Date().toISOString(),
        },
      });

      const request: DeleteProviderRequest = { providerId };

      const result = await service.deleteProvider(request);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockVault.update).toHaveBeenCalledOnce();
    });

    it('should return error when provider not found', async () => {
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request: DeleteProviderRequest = { providerId: 'non-existent' };

      const result = await service.deleteProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error when vault update fails', async () => {
      const providerId = 'test-provider-id';
      const now = new Date().toISOString();
      (mockVault.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'vault-entry-id',
        key: `custom-provider:${providerId}`,
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (mockVault.update as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Vault update failed'),
      );

      const request: DeleteProviderRequest = { providerId };

      const result = await service.deleteProvider(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vault update failed');
    });
  });

  describe('ListProviders contract', () => {
    it('should return all providers when no filter specified', async () => {
      const now = new Date().toISOString();
      const entry1 = {
        id: 'vault-entry-id-1',
        key: 'custom-provider:provider-1',
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Provider Alpha',
          url: 'https://api.alpha.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entry2 = {
        ...entry1,
        id: 'vault-entry-id-2',
        key: 'custom-provider:provider-2',
        metadata: {
          ...entry1.metadata,
          name: 'Provider Beta',
          url: 'https://api.beta.com/v1',
          status: 'Inactive',
        },
      };

      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([entry1, entry2]);

      const result = await service.listProviders({});

      expect(result.success).toBe(true);
      expect(result.providers).toBeDefined();
      expect(result.providers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.providers?.[0]?.apiKey).toBeNull();
      expect(result.providers?.[1]?.apiKey).toBeNull();
    });

    it('should filter by status', async () => {
      const now = new Date().toISOString();
      const activeEntry = {
        id: 'vault-entry-id-1',
        key: 'custom-provider:provider-1',
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Active Provider',
          url: 'https://api.active.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inactiveEntry = {
        ...activeEntry,
        id: 'vault-entry-id-2',
        key: 'custom-provider:provider-2',
        metadata: {
          ...activeEntry.metadata,
          name: 'Inactive Provider',
          status: 'Inactive',
        },
      };

      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([activeEntry, inactiveEntry]);

      const result = await service.listProviders({ status: 'Active' });

      expect(result.success).toBe(true);
      expect(result.providers).toHaveLength(1);
      expect(result.providers?.[0]?.name).toBe('Active Provider');
    });

    it('should support pagination with limit and offset', async () => {
      const now = new Date().toISOString();
      const entries = Array.from({ length: 5 }, (_, i) => ({
        id: `vault-entry-id-${i}`,
        key: `custom-provider:provider-${i}`,
        type: 'api_key' as const,
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active' as const,
        metadata: {
          name: `Provider ${String(i).padStart(2, '0')}`,
          url: `https://api.provider${i}.com/v1`,
          modelName: 'gpt-4',
          status: 'Active' as const,
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue(entries);

      const result = await service.listProviders({ limit: 2, offset: 1 });

      expect(result.success).toBe(true);
      expect(result.providers).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.providers?.[0]?.name).toBe('Provider 01');
      expect(result.providers?.[1]?.name).toBe('Provider 02');
    });

    it('should return empty array when no providers exist', async () => {
      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.listProviders({});

      expect(result.success).toBe(true);
      expect(result.providers).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should exclude API keys from response', async () => {
      const now = new Date().toISOString();
      const entry = {
        id: 'vault-entry-id',
        key: 'custom-provider:provider-1',
        type: 'api_key',
        encryptedValue: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        tag: 'tag',
        state: 'active',
        metadata: {
          name: 'Test Provider',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
          status: 'Active',
          createdAt: now,
          updatedAt: now,
          lastTestedAt: null,
          testResult: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockVault.list as ReturnType<typeof vi.fn>).mockResolvedValue([entry]);

      const result = await service.listProviders({});

      expect(result.success).toBe(true);
      expect(result.providers?.[0]?.apiKey).toBeNull();
    });

    it('should return error when vault list fails', async () => {
      (mockVault.list as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Vault unavailable'),
      );

      const result = await service.listProviders({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vault unavailable');
    });
  });
});
