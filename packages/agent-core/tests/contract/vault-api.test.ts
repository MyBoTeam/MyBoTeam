import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VaultService } from '../../src/vault/vault-service';

describe('vault-api contract', () => {
  let tempDir: string;
  let vault: VaultService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-contract-test-'));
    vault = new VaultService({ dataDir: tempDir });
    await vault.unlock('test-password');
  });

  afterEach(async () => {
    await vault.lock();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('store', () => {
    it('should store a secret successfully', async () => {
      const entry = await vault.store_entry('github-api-key', 'ghp_1234567890', 'api_key', {
        provider: 'github',
      });

      expect(entry).toHaveProperty('id');
      expect(entry.key).toBe('github-api-key');
      expect(entry.type).toBe('api_key');
      expect(entry.state).toBe('active');
      expect(entry.metadata).toEqual({ provider: 'github' });
    });

    it('should throw error when storing duplicate key', async () => {
      await vault.store_entry('github-api-key', 'ghp_1234567890', 'api_key');

      await expect(vault.store_entry('github-api-key', 'ghp_another', 'api_key')).rejects.toThrow(
        'Entry with key "github-api-key" already exists',
      );
    });

    it('should throw error when vault is locked', async () => {
      await vault.lock();

      await expect(vault.store_entry('test', 'value', 'api_key')).rejects.toThrow(
        'Vault is locked',
      );
    });
  });

  describe('retrieve', () => {
    it('should retrieve a secret successfully', async () => {
      await vault.store_entry('github-api-key', 'ghp_1234567890', 'api_key');

      const entry = await vault.retrieve('github-api-key');

      expect(entry).not.toBeNull();
      expect(entry?.key).toBe('github-api-key');
    });

    it('should return null for non-existent key', async () => {
      const entry = await vault.retrieve('non-existent');
      expect(entry).toBeNull();
    });

    it('should throw error when vault is locked', async () => {
      await vault.lock();

      await expect(vault.retrieve('test')).rejects.toThrow('Vault is locked');
    });
  });

  describe('decrypt', () => {
    it('should decrypt secret value successfully', async () => {
      const entry = await vault.store_entry('github-api-key', 'ghp_1234567890', 'api_key');

      const decrypted = await vault.decrypt(entry);

      expect(decrypted).toBe('ghp_1234567890');
    });

    it('should throw error when vault is locked', async () => {
      const entry = await vault.store_entry('github-api-key', 'ghp_1234567890', 'api_key');
      await vault.lock();

      await expect(vault.decrypt(entry)).rejects.toThrow('Vault is locked');
    });
  });

  describe('list', () => {
    it('should list all secrets', async () => {
      await vault.store_entry('key1', 'value1', 'api_key');
      await vault.store_entry('key2', 'value2', 'oauth_token');

      const entries = await vault.list();

      expect(entries).toHaveLength(2);
    });

    it('should filter by type', async () => {
      await vault.store_entry('key1', 'value1', 'api_key');
      await vault.store_entry('key2', 'value2', 'oauth_token');

      const entries = await vault.list({ type: 'api_key' });

      expect(entries).toHaveLength(1);
      expect(entries[0].type).toBe('api_key');
    });

    it('should throw error when vault is locked', async () => {
      await vault.lock();

      await expect(vault.list()).rejects.toThrow('Vault is locked');
    });
  });

  describe('update', () => {
    it('should update a secret successfully', async () => {
      await vault.store_entry('github-api-key', 'ghp_old', 'api_key');

      const updated = await vault.update('github-api-key', 'ghp_new');

      expect(updated.key).toBe('github-api-key');
      const decrypted = await vault.decrypt(updated);
      expect(decrypted).toBe('ghp_new');
    });

    it('should throw error for non-existent key', async () => {
      await expect(vault.update('non-existent', 'value')).rejects.toThrow(
        'Entry with key "non-existent" not found',
      );
    });

    it('should throw error when vault is locked', async () => {
      await vault.lock();

      await expect(vault.update('test', 'value')).rejects.toThrow('Vault is locked');
    });
  });

  describe('delete', () => {
    it('should delete a secret successfully', async () => {
      await vault.store_entry('github-api-key', 'ghp_1234567890', 'api_key');

      const result = await vault.delete('github-api-key');

      expect(result).toBe(true);
      const entry = await vault.retrieve('github-api-key');
      expect(entry).toBeNull();
    });

    it('should return false for non-existent key', async () => {
      const result = await vault.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should throw error when vault is locked', async () => {
      await vault.lock();

      await expect(vault.delete('test')).rejects.toThrow('Vault is locked');
    });
  });

  describe('refresh', () => {
    it('should throw error when vault is locked', async () => {
      await vault.lock();

      await expect(vault.refresh('test')).rejects.toThrow('Vault is locked');
    });

    it('should throw error for non-existent key', async () => {
      await expect(vault.refresh('non-existent')).rejects.toThrow(
        'Entry with key "non-existent" not found',
      );
    });
  });

  describe('error handling', () => {
    it('should throw error for empty key in store', async () => {
      await expect(vault.store_entry('', 'value', 'api_key')).rejects.toThrow(
        'Key must be 1-256 characters',
      );
    });

    it('should throw error for empty value in store', async () => {
      await expect(vault.store_entry('key', '', 'api_key')).rejects.toThrow(
        'Value cannot be empty',
      );
    });

    it('should throw error for invalid type in store', async () => {
      await expect(vault.store_entry('key', 'value', 'invalid_type' as any)).rejects.toThrow(
        'Type must be api_key, oauth_token, credential, or secret',
      );
    });

    it('should throw error for empty key in retrieve', async () => {
      await expect(vault.retrieve('')).rejects.toThrow('Key cannot be empty');
    });

    it('should throw error for null entry in decrypt', async () => {
      await expect(vault.decrypt(null as any)).rejects.toThrow('Entry cannot be null');
    });

    it('should throw error for invalid entry in decrypt', async () => {
      await expect(vault.decrypt({ encryptedValue: '', iv: '', salt: '' } as any)).rejects.toThrow(
        'Invalid entry: missing required fields',
      );
    });
  });
});
