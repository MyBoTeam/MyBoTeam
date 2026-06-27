import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnvKeyProvider, PlatformKeyProvider } from '../../../src/vault/vault-key-provider';

describe('vault-key-provider', () => {
  describe('PlatformKeyProvider', () => {
    let provider: PlatformKeyProvider;

    beforeEach(() => {
      provider = new PlatformKeyProvider();
    });

    it('should create a PlatformKeyProvider instance', () => {
      expect(provider).toBeInstanceOf(PlatformKeyProvider);
    });

    it('should derive a key of correct length', async () => {
      const password = 'test-password';
      const salt = provider.generateSalt();

      const key = await provider.deriveKey(password, salt);

      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should derive the same key with same password and salt', async () => {
      const password = 'test-password';
      const salt = provider.generateSalt();

      const key1 = await provider.deriveKey(password, salt);
      const key2 = await provider.deriveKey(password, salt);

      expect(key1.equals(key2)).toBe(true);
    });

    it('should generate a salt of correct length', () => {
      const salt = provider.generateSalt();
      expect(salt).toBeInstanceOf(Buffer);
      expect(salt.length).toBe(32);
    });
  });

  describe('EnvKeyProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should throw error when VAULT_PASSWORD is not set', () => {
      delete process.env.VAULT_PASSWORD;
      delete process.env.MYBOTEAM_VAULT_PASSWORD;

      expect(() => new EnvKeyProvider()).toThrow('VAULT_PASSWORD environment variable is required');
    });

    it('should create an EnvKeyProvider instance when VAULT_PASSWORD is set', () => {
      process.env.VAULT_PASSWORD = 'test-vault-password';

      const provider = new EnvKeyProvider();
      expect(provider).toBeInstanceOf(EnvKeyProvider);
    });

    it('should derive a key of correct length', async () => {
      process.env.VAULT_PASSWORD = 'test-vault-password';
      const provider = new EnvKeyProvider();
      const salt = provider.generateSalt();

      const key = await provider.deriveKey('any-password', salt);

      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should derive the same key regardless of password parameter', async () => {
      process.env.VAULT_PASSWORD = 'test-vault-password';
      const provider = new EnvKeyProvider();
      const salt = provider.generateSalt();

      const key1 = await provider.deriveKey('password1', salt);
      const key2 = await provider.deriveKey('password2', salt);

      expect(key1.equals(key2)).toBe(true);
    });
  });

  describe('key recovery', () => {
    it('should recover the same key with same password and salt', async () => {
      const provider = new PlatformKeyProvider();
      const password = 'recovery-password';
      const salt = provider.generateSalt();

      const key1 = await provider.deriveKey(password, salt);
      const key2 = await provider.deriveKey(password, salt);

      expect(key1.equals(key2)).toBe(true);
    });

    it('should fail recovery with wrong password', async () => {
      const provider = new PlatformKeyProvider();
      const salt = provider.generateSalt();

      const key1 = await provider.deriveKey('correct-password', salt);
      const key2 = await provider.deriveKey('wrong-password', salt);

      expect(key1.equals(key2)).toBe(false);
    });

    it('should fail recovery with wrong salt', async () => {
      const provider = new PlatformKeyProvider();
      const password = 'recovery-password';

      const key1 = await provider.deriveKey(password, provider.generateSalt());
      const key2 = await provider.deriveKey(password, provider.generateSalt());

      expect(key1.equals(key2)).toBe(false);
    });
  });
});
