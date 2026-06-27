import { EventEmitter } from 'node:events';
import { createChildLogger } from '../storage/logger.js';
import { VaultStore } from '../storage/vault-store.js';
import { decrypt, type EncryptedData, encrypt, generateSalt } from './vault-crypto.js';
import { type KeyProvider, PlatformKeyProvider } from './vault-key-provider.js';
import { type ReadWriteLock, SimpleReadWriteLock } from './vault-rwlock.js';
import type { SecretState, VaultData, VaultEntry, VaultEntryType } from './vault-types.js';

export interface VaultConfig {
  dataDir: string;
  keyProvider?: KeyProvider;
}

export class VaultService {
  private store: VaultStore;
  private keyProvider: KeyProvider;
  private rwLock: ReadWriteLock;
  private encryptionKey: Buffer | null = null;
  private isUnlocked = false;
  private log: ReturnType<typeof createChildLogger>;
  private emitter = new EventEmitter();

  constructor(config: VaultConfig) {
    this.store = new VaultStore({
      dataDir: config.dataDir,
      fileName: 'secure-storage.json',
    });
    this.keyProvider = config.keyProvider || new PlatformKeyProvider();
    this.rwLock = new SimpleReadWriteLock();
    this.log = createChildLogger({ module: 'vault-service' });
  }

  onRefreshFailure(listener: (key: string, error: Error) => void): void {
    this.emitter.on('refreshFailure', listener);
  }

  async unlock(password: string): Promise<void> {
    const salt = this.keyProvider.generateSalt();
    this.encryptionKey = await this.keyProvider.deriveKey(password, salt);
    this.isUnlocked = true;
  }

  async lock(): Promise<void> {
    this.encryptionKey = null;
    this.isUnlocked = false;
  }

  async store_entry(
    key: string,
    value: string,
    type: VaultEntryType,
    metadata: Record<string, unknown> = {},
  ): Promise<VaultEntry> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error('Vault is locked');
    }

    if (!key || key.length === 0 || key.length > 256) {
      throw new Error('Key must be 1-256 characters');
    }

    if (!value || value.length === 0) {
      throw new Error('Value cannot be empty');
    }

    if (!['api_key', 'oauth_token', 'credential', 'secret'].includes(type)) {
      throw new Error('Type must be api_key, oauth_token, credential, or secret');
    }

    await this.rwLock.writeLock();
    try {
      const vaultData = await this.loadVault();
      const existingEntry = vaultData.entries.find((e) => e.key === key && e.state !== 'deleted');
      if (existingEntry) {
        throw new Error(`Entry with key "${key}" already exists`);
      }

      const salt = generateSalt();
      const encrypted = await encrypt(value, this.encryptionKey);
      const entry: VaultEntry = {
        id: crypto.randomUUID(),
        key,
        type,
        encryptedValue: encrypted.encrypted,
        iv: encrypted.iv,
        salt: salt.toString('hex'),
        tag: encrypted.tag,
        state: 'active',
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vaultData.entries.push(entry);
      await this.saveVault(vaultData);
      this.log.info({ key, type, id: entry.id }, 'Secret stored successfully');
      return entry;
    } finally {
      await this.rwLock.writeUnlock();
    }
  }

  async retrieve(key: string): Promise<VaultEntry | null> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error('Vault is locked');
    }

    if (!key || key.length === 0) {
      throw new Error('Key cannot be empty');
    }

    await this.rwLock.readLock();
    try {
      const vaultData = await this.loadVault();
      const entry = vaultData.entries.find((e) => e.key === key && e.state !== 'deleted');
      if (entry) {
        this.log.debug({ key, id: entry.id }, 'Secret retrieved');
      } else {
        this.log.debug({ key }, 'Secret not found');
      }
      return entry || null;
    } finally {
      await this.rwLock.readUnlock();
    }
  }

  async decrypt(entry: VaultEntry): Promise<string> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error('Vault is locked');
    }

    if (!entry) {
      throw new Error('Entry cannot be null');
    }

    if (!entry.encryptedValue || !entry.iv || !entry.salt) {
      throw new Error('Invalid entry: missing required fields');
    }

    const encryptedData: EncryptedData = {
      encrypted: entry.encryptedValue,
      iv: entry.iv,
      tag: entry.tag,
    };

    return decrypt(encryptedData, this.encryptionKey);
  }

  async list(filter?: { type?: VaultEntryType; state?: SecretState }): Promise<VaultEntry[]> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error('Vault is locked');
    }

    await this.rwLock.readLock();
    try {
      const vaultData = await this.loadVault();
      let entries = vaultData.entries.filter((e) => e.state !== 'deleted');

      if (filter?.type) {
        entries = entries.filter((e) => e.type === filter.type);
      }
      if (filter?.state) {
        entries = entries.filter((e) => e.state === filter.state);
      }

      return entries;
    } finally {
      await this.rwLock.readUnlock();
    }
  }

  async update(
    key: string,
    value: string,
    metadata?: Record<string, unknown>,
  ): Promise<VaultEntry> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error('Vault is locked');
    }

    await this.rwLock.writeLock();
    try {
      const vaultData = await this.loadVault();
      const entryIndex = vaultData.entries.findIndex((e) => e.key === key && e.state !== 'deleted');

      if (entryIndex === -1) {
        throw new Error(`Entry with key "${key}" not found`);
      }

      const salt = generateSalt();
      const encrypted = await encrypt(value, this.encryptionKey);
      const entry = vaultData.entries[entryIndex];

      entry.encryptedValue = encrypted.encrypted;
      entry.iv = encrypted.iv;
      entry.salt = salt.toString('hex');
      entry.tag = encrypted.tag;
      entry.updatedAt = new Date();
      if (metadata) {
        entry.metadata = metadata;
      }

      await this.saveVault(vaultData);
      return entry;
    } finally {
      await this.rwLock.writeUnlock();
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error('Vault is locked');
    }

    await this.rwLock.writeLock();
    try {
      const vaultData = await this.loadVault();
      const entry = vaultData.entries.find((e) => e.key === key && e.state !== 'deleted');

      if (!entry) {
        return false;
      }

      entry.state = 'deleted';
      entry.updatedAt = new Date();
      await this.saveVault(vaultData);
      return true;
    } finally {
      await this.rwLock.writeUnlock();
    }
  }

  async refresh(key: string): Promise<VaultEntry> {
    if (!this.isUnlocked || !this.encryptionKey) {
      throw new Error('Vault is locked');
    }

    if (!key || key.length === 0) {
      throw new Error('Key cannot be empty');
    }

    await this.rwLock.writeLock();
    try {
      const vaultData = await this.loadVault();
      const entry = vaultData.entries.find((e) => e.key === key && e.state !== 'deleted');

      if (!entry) {
        throw new Error(`Entry with key "${key}" not found`);
      }

      if (entry.type !== 'oauth_token') {
        throw new Error('Refresh is only supported for oauth_token entries');
      }

      entry.updatedAt = new Date();
      await this.saveVault(vaultData);
      this.log.info({ key, id: entry.id }, 'Token refresh initiated');
      return entry;
    } catch (error) {
      this.emitter.emit('refreshFailure', key, error);
      throw error;
    } finally {
      await this.rwLock.writeUnlock();
    }
  }

  private async loadVault(): Promise<VaultData> {
    const data = await this.store.read();
    if (!data) {
      return { version: '1.0', salt: '', entries: [] };
    }
    return JSON.parse(data);
  }

  private async saveVault(vaultData: VaultData): Promise<void> {
    await this.store.write(JSON.stringify(vaultData, null, 2));
  }
}
