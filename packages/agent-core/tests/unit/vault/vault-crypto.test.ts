import { describe, expect, it } from 'vitest';
import { decrypt, deriveKey, encrypt, generateSalt } from '../../../src/vault/vault-crypto';

describe('vault-crypto', () => {
  describe('encrypt', () => {
    it('should encrypt plaintext successfully', async () => {
      const plaintext = 'my-secret-api-key';
      const key = Buffer.alloc(32, 1);

      const result = await encrypt(plaintext, key);

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(result.encrypted).not.toBe(plaintext);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data successfully', async () => {
      const plaintext = 'my-secret-api-key';
      const key = Buffer.alloc(32, 1);

      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error with wrong key', async () => {
      const plaintext = 'my-secret-api-key';
      const key = Buffer.alloc(32, 1);
      const wrongKey = Buffer.alloc(32, 2);

      const encrypted = await encrypt(plaintext, key);

      await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
    });
  });

  describe('generateSalt', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Buffer);
      expect(salt.length).toBe(32);
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1.equals(salt2)).toBe(false);
    });
  });

  describe('deriveKey', () => {
    it('should derive a key of correct length', async () => {
      const password = 'test-password';
      const salt = generateSalt();

      const key = await deriveKey(password, salt);

      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should derive the same key with same password and salt', async () => {
      const password = 'test-password';
      const salt = generateSalt();

      const key1 = await deriveKey(password, salt);
      const key2 = await deriveKey(password, salt);

      expect(key1.equals(key2)).toBe(true);
    });

    it('should derive different keys with different passwords', async () => {
      const salt = generateSalt();

      const key1 = await deriveKey('password1', salt);
      const key2 = await deriveKey('password2', salt);

      expect(key1.equals(key2)).toBe(false);
    });
  });
});
