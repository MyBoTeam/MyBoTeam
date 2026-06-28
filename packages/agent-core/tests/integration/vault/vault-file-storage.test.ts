import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VaultStore } from '../../../src/storage/vault-store';

describe('vault-file-storage', () => {
  let tempDir: string;
  let store: VaultStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-test-'));
    store = new VaultStore({
      dataDir: tempDir,
      fileName: 'test-vault.json',
    });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('read', () => {
    it('should return null when file does not exist', async () => {
      const result = await store.read();
      expect(result).toBeNull();
    });

    it('should read data from file', async () => {
      const testData = JSON.stringify({ test: 'data' });
      await store.write(testData);

      const result = await store.read();
      expect(result).toBe(testData);
    });
  });

  describe('write', () => {
    it('should write data to file', async () => {
      const testData = JSON.stringify({ test: 'data' });
      await store.write(testData);

      const result = await store.read();
      expect(result).toBe(testData);
    });

    it('should create directory if it does not exist', async () => {
      const newStore = new VaultStore({
        dataDir: join(tempDir, 'new-dir'),
        fileName: 'test.json',
      });

      await newStore.write('test data');
      const result = await newStore.read();
      expect(result).toBe('test data');
    });

    it('should overwrite existing data', async () => {
      await store.write('first');
      await store.write('second');

      const result = await store.read();
      expect(result).toBe('second');
    });
  });

  describe('exists', () => {
    it('should return false when file does not exist', async () => {
      const result = await store.exists();
      expect(result).toBe(false);
    });

    it('should return true when file exists', async () => {
      await store.write('test');
      const result = await store.exists();
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete file', async () => {
      await store.write('test');
      await store.delete();

      const result = await store.exists();
      expect(result).toBe(false);
    });

    it('should not throw when file does not exist', async () => {
      await expect(store.delete()).resolves.not.toThrow();
    });
  });

  describe('getFilePath', () => {
    it('should return correct file path', () => {
      const expectedPath = join(tempDir, 'test-vault.json');
      expect(store.getFilePath()).toBe(expectedPath);
    });
  });

  describe('storing secrets', () => {
    it('should persist vault data across read/write cycles', async () => {
      const vaultData = {
        version: '1.0',
        salt: 'test-salt',
        entries: [
          {
            id: '1',
            key: 'github-api-key',
            type: 'api_key',
            encryptedValue: 'encrypted-value',
            iv: 'iv-value',
            salt: 'salt-value',
            state: 'active',
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      await store.write(JSON.stringify(vaultData));
      const readData = await store.read();
      const parsed = JSON.parse(readData ?? '');

      expect(parsed.version).toBe('1.0');
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0].key).toBe('github-api-key');
    });
  });

  describe('retrieving secrets', () => {
    it('should retrieve vault data with multiple entries', async () => {
      const vaultData = {
        version: '1.0',
        salt: 'test-salt',
        entries: [
          {
            id: '1',
            key: 'github-api-key',
            type: 'api_key',
            encryptedValue: 'encrypted-value-1',
            iv: 'iv-value-1',
            salt: 'salt-value-1',
            state: 'active',
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            key: 'google-oauth',
            type: 'oauth_token',
            encryptedValue: 'encrypted-value-2',
            iv: 'iv-value-2',
            salt: 'salt-value-2',
            state: 'active',
            metadata: { provider: 'google' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      await store.write(JSON.stringify(vaultData));
      const readData = await store.read();
      const parsed = JSON.parse(readData ?? '');

      expect(parsed.entries).toHaveLength(2);
      expect(parsed.entries[0].key).toBe('github-api-key');
      expect(parsed.entries[1].key).toBe('google-oauth');
    });
  });

  describe('key recovery', () => {
    it('should preserve vault data across multiple write/read cycles', async () => {
      const vaultData = {
        version: '1.0',
        salt: 'test-salt',
        entries: [
          {
            id: '1',
            key: 'github-api-key',
            type: 'api_key',
            encryptedValue: 'encrypted-value',
            iv: 'iv-value',
            salt: 'salt-value',
            state: 'active',
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      await store.write(JSON.stringify(vaultData));
      const readData1 = await store.read();
      const parsed1 = JSON.parse(readData1 ?? '');

      await store.write(JSON.stringify(parsed1));
      const readData2 = await store.read();
      const parsed2 = JSON.parse(readData2 ?? '');

      expect(parsed2.entries).toHaveLength(1);
      expect(parsed2.entries[0].key).toBe('github-api-key');
    });
  });
});
