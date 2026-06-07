import * as crypto from 'node:crypto';
import * as os from 'node:os';
import type { ApiKeyProvider } from '../common/types/provider.js';

export const API_KEY_PROVIDERS: ApiKeyProvider[] = [
  'anthropic',
  'openai',
  'openrouter',
  'google',
  'xai',
  'deepseek',
  'moonshot',
  'zai',
  'azure-foundry',
  'custom',
  'bedrock',
  'litellm',
  'minimax',
  'lmstudio',
  'elevenlabs',
];

export function getMachineData(appId: string): string {
  return [os.platform(), os.homedir(), os.userInfo().username, appId].join(':');
}

export function generateSalt(): Buffer {
  return crypto.randomBytes(32);
}

export function deriveKey(machineData: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(machineData, salt, 100000, 32, 'sha256');
}

export function encryptValue(value: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decryptValue(encryptedData: string, key: Buffer): string | null {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      return null;
    }
    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}
