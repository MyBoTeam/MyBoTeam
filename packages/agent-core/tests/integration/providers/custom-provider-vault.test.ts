import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CustomProviderService } from '../../../src/providers/custom-config.js';
import { VaultService } from '../../../src/vault/vault-service.js';

describe('custom-provider-vault-integration', () => {
  let tempDir: string;
  let vaultService: VaultService;
  let service: CustomProviderService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'custom-provider-vault-test-'));
    vaultService = new VaultService({ dataDir: tempDir });
    await vaultService.unlock('test-password');
    service = new CustomProviderService(vaultService);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('CRUD operations with vault', () => {
    it('should store and retrieve provider with encrypted API key', async () => {
      const createResult = await service.createProvider({
        name: 'Test Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-secret-key-12345',
        modelName: 'gpt-4',
      });

      expect(createResult.success).toBe(true);
      const providerId = createResult.provider!.id;

      const getResult = await service.getProvider({ providerId });
      expect(getResult.success).toBe(true);
      expect(getResult.provider!.name).toBe('Test Provider');
      expect(getResult.provider!.url).toBe('https://api.example.com/v1');
      expect(getResult.provider!.modelName).toBe('gpt-4');
      expect(getResult.provider!.apiKey).toBeNull();
    });

    it('should update provider and persist changes', async () => {
      const createResult = await service.createProvider({
        name: 'Original Name',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-key',
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;

      const updateResult = await service.updateProvider({
        providerId,
        name: 'Updated Name',
        url: 'https://api.updated.com/v1',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.provider!.name).toBe('Updated Name');
      expect(updateResult.provider!.url).toBe('https://api.updated.com/v1');

      const getResult = await service.getProvider({ providerId });
      expect(getResult.provider!.name).toBe('Updated Name');
    });

    it('should soft delete provider (set status to Inactive)', async () => {
      const createResult = await service.createProvider({
        name: 'To Delete',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-key',
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;

      const deleteResult = await service.deleteProvider({ providerId });
      expect(deleteResult.success).toBe(true);

      const getResult = await service.getProvider({ providerId });
      expect(getResult.provider!.status).toBe('Inactive');
    });

    it('should list all providers with pagination', async () => {
      await service.createProvider({
        name: 'Provider 1',
        url: 'https://api1.example.com/v1',
        modelName: 'gpt-4',
      });
      await service.createProvider({
        name: 'Provider 2',
        url: 'https://api2.example.com/v1',
        modelName: 'gpt-3.5-turbo',
      });
      await service.createProvider({
        name: 'Provider 3',
        url: 'https://api3.example.com/v1',
        modelName: 'llama-3',
      });

      const listResult = await service.listProviders({});
      expect(listResult.success).toBe(true);
      expect(listResult.providers).toHaveLength(3);
      expect(listResult.total).toBe(3);

      const paginatedResult = await service.listProviders({ limit: 2, offset: 0 });
      expect(paginatedResult.providers).toHaveLength(2);
    });

    it('should filter providers by status', async () => {
      const createResult = await service.createProvider({
        name: 'Active Provider',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      });

      await service.createProvider({
        name: 'Another Provider',
        url: 'https://api2.example.com/v1',
        modelName: 'gpt-4',
      });

      await service.deleteProvider({ providerId: createResult.provider!.id });

      const activeResult = await service.listProviders({ status: 'Active' });
      expect(activeResult.providers).toHaveLength(1);

      const inactiveResult = await service.listProviders({ status: 'Inactive' });
      expect(inactiveResult.providers).toHaveLength(1);
    });
  });

  describe('security - API key handling', () => {
    it('should never expose API key in provider response', async () => {
      const createResult = await service.createProvider({
        name: 'Secure Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-super-secret-key',
        modelName: 'gpt-4',
      });

      expect(createResult.provider!.apiKey).toBeNull();

      const getResult = await service.getProvider({ providerId: createResult.provider!.id });
      expect(getResult.provider!.apiKey).toBeNull();

      const listResult = await service.listProviders({});
      for (const provider of listResult.providers!) {
        expect(provider.apiKey).toBeNull();
      }
    });

    it('should store API key encrypted in vault', async () => {
      const createResult = await service.createProvider({
        name: 'Encrypted Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-plaintext-key',
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;
      const vaultKey = `custom-provider:${providerId}`;

      const vaultEntry = await vaultService.retrieve(vaultKey);
      expect(vaultEntry).not.toBeNull();
      expect(vaultEntry!.encryptedValue).not.toBe('sk-plaintext-key');
      expect(vaultEntry!.encryptedValue.length).toBeGreaterThan(0);
    });
  });

  describe('state management', () => {
    it('should transition provider through valid states', async () => {
      const createResult = await service.createProvider({
        name: 'State Test',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;
      expect(createResult.provider!.status).toBe('Active');

      const deactivateResult = await service.updateProviderStatus(providerId, 'Inactive');
      expect(deactivateResult.provider!.status).toBe('Inactive');

      const reactivateResult = await service.updateProviderStatus(providerId, 'Active');
      expect(reactivateResult.provider!.status).toBe('Active');
    });

    it('should reject invalid state transitions', async () => {
      const createResult = await service.createProvider({
        name: 'Invalid Transition',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;

      const result = await service.updateProviderStatus(providerId, 'Inactive');
      expect(result.success).toBe(true);

      const invalidResult = await service.updateProviderStatus(providerId, 'Error');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('INVALID_STATE_TRANSITION');
    });
  });

  describe('uniqueness validation', () => {
    it('should reject duplicate provider name', async () => {
      await service.createProvider({
        name: 'Unique Name',
        url: 'https://api1.example.com/v1',
        modelName: 'gpt-4',
      });

      const result = await service.createProvider({
        name: 'Unique Name',
        url: 'https://api2.example.com/v1',
        modelName: 'gpt-4',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PROVIDER_NAME_EXISTS');
    });

    it('should reject duplicate provider URL', async () => {
      await service.createProvider({
        name: 'Provider 1',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      });

      const result = await service.createProvider({
        name: 'Provider 2',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PROVIDER_URL_EXISTS');
    });
  });

  describe('provider count limit', () => {
    it('should enforce maximum provider limit', async () => {
      for (let i = 0; i < 50; i++) {
        await service.createProvider({
          name: `Provider ${i}`,
          url: `https://api${i}.example.com/v1`,
          modelName: 'gpt-4',
        });
      }

      const result = await service.createProvider({
        name: 'Provider 51',
        url: 'https://api51.example.com/v1',
        modelName: 'gpt-4',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider limit reached');
    });
  });

  describe('performance metrics (SC-001)', () => {
    it('should complete provider configuration within 5 seconds', async () => {
      const startTime = Date.now();

      await service.createProvider({
        name: 'Performance Test Provider',
        url: 'https://api.example.com/v1',
        apiKey: 'sk-test-key',
        modelName: 'gpt-4',
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should complete provider retrieval within 100ms', async () => {
      const createResult = await service.createProvider({
        name: 'Fast Retrieval Provider',
        url: 'https://api.example.com/v1',
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;

      const startTime = Date.now();
      await service.getProvider({ providerId });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should complete provider list within 100ms', async () => {
      await service.createProvider({
        name: 'List Test Provider 1',
        url: 'https://api1.example.com/v1',
        modelName: 'gpt-4',
      });
      await service.createProvider({
        name: 'List Test Provider 2',
        url: 'https://api2.example.com/v1',
        modelName: 'gpt-4',
      });

      const startTime = Date.now();
      await service.listProviders({});
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('timeout scenarios (SC-004)', () => {
    it('should return error for connection failure', async () => {
      const createResult = await service.createProvider({
        name: 'Connection Failure Provider',
        url: 'http://localhost:1', // Invalid port that will fail to connect
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;

      const testResult = await service.testConnection({ providerId });
      // testResult.success means the method executed successfully
      // testResult.result.success means the actual connection test passed
      expect(testResult.success).toBe(true); // Method executed
      expect(testResult.result).toBeDefined();
      expect(testResult.result!.success).toBe(false); // Connection test failed
      expect(testResult.result!.error).toBeDefined();
    });

    it('should respect timeout parameter', async () => {
      const createResult = await service.createProvider({
        name: 'Timeout Parameter Provider',
        url: 'http://localhost:1',
        modelName: 'gpt-4',
      });

      const providerId = createResult.provider!.id;

      const startTime = Date.now();
      const testResult = await service.testConnection({ providerId, timeout: 1000 });
      const duration = Date.now() - startTime;

      expect(testResult.success).toBe(true); // Method executed
      expect(testResult.result).toBeDefined();
      expect(testResult.result!.success).toBe(false); // Connection test failed
      // Should complete reasonably quickly (within 5 seconds including network overhead)
      expect(duration).toBeLessThan(5000);
    });
  });
});
