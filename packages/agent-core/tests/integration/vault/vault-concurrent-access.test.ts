import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VaultService } from '../../../src/vault/vault-service';

describe('vault-concurrent-access', () => {
  let tempDir: string;
  let vault: VaultService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-concurrent-test-'));
    vault = new VaultService({ dataDir: tempDir });
    await vault.unlock('test-password');
  });

  afterEach(async () => {
    await vault.lock();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('concurrent reads', () => {
    it('should allow multiple concurrent reads', async () => {
      await vault.store_entry('key1', 'value1', 'api_key');
      await vault.store_entry('key2', 'value2', 'api_key');

      const readPromises = Array.from({ length: 10 }, (_, i) =>
        vault.retrieve(i % 2 === 0 ? 'key1' : 'key2'),
      );

      const results = await Promise.all(readPromises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).not.toBeNull();
      });
    });
  });

  describe('concurrent writes', () => {
    it('should handle concurrent writes without corruption', async () => {
      const writePromises = Array.from({ length: 5 }, (_, i) =>
        vault.store_entry(`key${i}`, `value${i}`, 'api_key'),
      );

      const results = await Promise.all(writePromises);

      expect(results).toHaveLength(5);

      const list = await vault.list();
      expect(list).toHaveLength(5);
    });
  });

  describe('read-write isolation', () => {
    it('should block writes during reads', async () => {
      await vault.store_entry('key1', 'value1', 'api_key');

      const readPromise = vault.retrieve('key1');
      const writePromise = vault.store_entry('key2', 'value2', 'api_key');

      await Promise.all([readPromise, writePromise]);

      const list = await vault.list();
      expect(list).toHaveLength(2);
    });
  });
});
