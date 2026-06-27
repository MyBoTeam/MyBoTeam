import { pbkdf2, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { createChildLogger } from '../storage/logger.js';

const pbkdf2Async = promisify(pbkdf2);
const log = createChildLogger({ module: 'vault-key-provider' });

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const DIGEST = 'sha512';

export interface KeyProvider {
  deriveKey(password: string, salt: Buffer): Promise<Buffer>;
  generateSalt(): Buffer;
  rotateKey?(oldPassword: string, newPassword: string, salt: Buffer): Promise<Buffer>;
}

export class PlatformKeyProvider implements KeyProvider {
  private platformSalt: Buffer;

  constructor() {
    this.platformSalt = this.generatePlatformSalt();
  }

  async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const combinedSalt = Buffer.concat([this.platformSalt, salt]);
    return pbkdf2Async(
      password,
      combinedSalt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      DIGEST,
    ) as Promise<Buffer>;
  }

  generateSalt(): Buffer {
    return randomBytes(32);
  }

  async rotateKey(oldPassword: string, newPassword: string, salt: Buffer): Promise<Buffer> {
    if (!oldPassword || !newPassword) {
      throw new Error('Both old and new passwords are required for key rotation');
    }
    if (!salt || salt.length === 0) {
      throw new Error('Salt is required for key rotation');
    }
    log.info('Key rotation initiated');
    const key = await this.deriveKey(newPassword, salt);
    log.info('Key rotation completed');
    return key;
  }

  private generatePlatformSalt(): Buffer {
    const hostname = process.env.HOSTNAME || process.env.COMPUTERNAME || 'default';
    const username = process.env.USER || process.env.USERNAME || 'default';
    const saltMaterial = `${hostname}:${username}:vault-salt`;
    return Buffer.from(saltMaterial, 'utf8');
  }
}

export class EnvKeyProvider implements KeyProvider {
  private envPassword: string;

  constructor() {
    this.envPassword = process.env.VAULT_PASSWORD || process.env.MYBOTEAM_VAULT_PASSWORD || '';
    if (!this.envPassword) {
      throw new Error('VAULT_PASSWORD environment variable is required');
    }
  }

  async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return pbkdf2Async(
      this.envPassword,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      DIGEST,
    ) as Promise<Buffer>;
  }

  generateSalt(): Buffer {
    return randomBytes(32);
  }

  async rotateKey(oldPassword: string, newPassword: string, salt: Buffer): Promise<Buffer> {
    if (!oldPassword || !newPassword) {
      throw new Error('Both old and new passwords are required for key rotation');
    }
    if (!salt || salt.length === 0) {
      throw new Error('Salt is required for key rotation');
    }
    log.info('Key rotation initiated');
    const key = await this.deriveKey(newPassword, salt);
    log.info('Key rotation completed');
    return key;
  }
}
