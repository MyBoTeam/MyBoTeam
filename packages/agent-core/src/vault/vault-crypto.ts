import { createCipheriv, createDecipheriv, pbkdf2, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const DIGEST = 'sha512';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return pbkdf2Async(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST) as Promise<Buffer>;
}

export async function encrypt(plaintext: string, key: Buffer): Promise<EncryptedData> {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export async function decrypt(encryptedData: EncryptedData, key: Buffer): Promise<string> {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH);
}

export async function reEncrypt(
  encryptedData: EncryptedData,
  oldKey: Buffer,
  newKey: Buffer,
): Promise<EncryptedData> {
  const plaintext = await decrypt(encryptedData, oldKey);
  return encrypt(plaintext, newKey);
}
