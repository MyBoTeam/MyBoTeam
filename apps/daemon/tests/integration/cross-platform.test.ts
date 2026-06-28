import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataDirectoryManager } from '../../src/data-directory.js';

describe('Cross-Platform Integration', () => {
  let tempDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myboteam-crossplatform-'));
    process.env = { ...originalEnv };
    process.env.MYBOTEAM_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create directory structure on current platform', async () => {
    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    expect(fs.existsSync(tempDir)).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'data'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'logs'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'vault'))).toBe(true);
  });

  it('should handle platform-specific path separators', () => {
    const manager = new DataDirectoryManager();
    const pathResolver = manager.getPathResolver();
    const dataDir = pathResolver.getDataDir();

    expect(dataDir).toBeDefined();
    expect(typeof dataDir).toBe('string');
  });

  it('should handle paths with spaces', async () => {
    const dirWithSpaces = path.join(tempDir, 'path with spaces');
    process.env.MYBOTEAM_DATA_DIR = dirWithSpaces;

    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    expect(fs.existsSync(dirWithSpaces)).toBe(true);
    expect(fs.existsSync(path.join(dirWithSpaces, 'data'))).toBe(true);
  });

  it('should handle paths with special characters', async () => {
    const dirWithSpecialChars = path.join(tempDir, 'path-with-special_chars.123');
    process.env.MYBOTEAM_DATA_DIR = dirWithSpecialChars;

    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    expect(fs.existsSync(dirWithSpecialChars)).toBe(true);
  });
});
