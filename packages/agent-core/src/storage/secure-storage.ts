import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ApiKeyProvider } from '../common/types/provider.js';
import {
  API_KEY_PROVIDERS,
  decryptValue as decrypt,
  deriveKey,
  encryptValue as encrypt,
  generateSalt,
  getMachineData,
} from './secure-storage-utils.js';

export interface SecureStorageOptions {
  storagePath: string;
  appId: string;
  fileName?: string;
}

interface SecureStorageSchema {
  values: Record<string, string>;
  salt?: string;
}

export type { ApiKeyProvider };

export class SecureStorage {
  private storagePath: string;
  private appId: string;
  private filePath: string;
  private derivedKey: Buffer | null = null;
  private data: SecureStorageSchema | null = null;

  constructor(options: SecureStorageOptions) {
    this.storagePath = options.storagePath;
    this.appId = options.appId;
    this.filePath = path.join(this.storagePath, options.fileName || 'secure-storage.json');
  }

  private loadData(): SecureStorageSchema {
    if (this.data) return this.data;
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(content) as SecureStorageSchema;
      } else {
        this.data = { values: {} };
      }
    } catch {
      this.data = { values: {} };
    }
    return this.data;
  }

  private saveData(): void {
    if (!this.data) return;
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${this.filePath}.${process.pid}.tmp`;
    const content = JSON.stringify(this.data, null, 2);
    try {
      fs.writeFileSync(tempPath, content, { mode: 0o600 });
      fs.renameSync(tempPath, this.filePath);
    } catch (error) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  private getOrCreateDerivedKey(): Buffer {
    if (this.derivedKey) return this.derivedKey;
    const data = this.loadData();
    if (!data.salt) {
      const salt = generateSalt();
      data.salt = salt.toString('base64');
      this.saveData();
    }
    const salt = Buffer.from(data.salt, 'base64');
    this.derivedKey = deriveKey(getMachineData(this.appId), salt);
    return this.derivedKey;
  }

  storeApiKey(provider: string, apiKey: string): void {
    const data = this.loadData();
    data.values[`apiKey:${provider}`] = encrypt(apiKey, this.getOrCreateDerivedKey());
    this.saveData();
  }

  getApiKey(provider: string): string | null {
    const data = this.loadData();
    const encrypted = data.values[`apiKey:${provider}`];
    if (!encrypted) return null;
    return decrypt(encrypted, this.getOrCreateDerivedKey());
  }

  deleteApiKey(provider: string): boolean {
    const data = this.loadData();
    const key = `apiKey:${provider}`;
    if (!(key in data.values)) return false;
    delete data.values[key];
    this.saveData();
    return true;
  }

  async getAllApiKeys(): Promise<Record<ApiKeyProvider, string | null>> {
    const result: Record<string, string | null> = {};
    for (const provider of API_KEY_PROVIDERS) {
      result[provider] = this.getApiKey(provider);
    }
    return result as Record<ApiKeyProvider, string | null>;
  }

  storeBedrockCredentials(credentials: string): void {
    this.storeApiKey('bedrock', credentials);
  }

  getBedrockCredentials(): Record<string, string> | null {
    const stored = this.getApiKey('bedrock');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  async hasAnyApiKey(): Promise<boolean> {
    const keys = await this.getAllApiKeys();
    return Object.values(keys).some((k) => k !== null);
  }

  listStoredCredentials(): Array<{ account: string; password: string }> {
    const data = this.loadData();
    const key = this.getOrCreateDerivedKey();
    const credentials: Array<{ account: string; password: string }> = [];
    for (const entry of Object.keys(data.values)) {
      const decrypted = decrypt(data.values[entry], key);
      if (decrypted) {
        credentials.push({ account: entry, password: decrypted });
      }
    }
    return credentials;
  }

  clearSecureStorage(): void {
    this.data = { values: {} };
    this.derivedKey = null;
    this.saveData();
  }

  set(key: string, value: string): void {
    const data = this.loadData();
    data.values[key] = encrypt(value, this.getOrCreateDerivedKey());
    this.saveData();
  }

  get(key: string): string | null {
    const data = this.loadData();
    const encrypted = data.values[key];
    if (!encrypted) return null;
    return decrypt(encrypted, this.getOrCreateDerivedKey());
  }

  delete(key: string): boolean {
    const data = this.loadData();
    if (!(key in data.values)) return false;
    delete data.values[key];
    this.saveData();
    return true;
  }

  has(key: string): boolean {
    const data = this.loadData();
    return key in data.values;
  }
}

export function createSecureStorage(options: SecureStorageOptions): SecureStorage {
  return new SecureStorage(options);
}
