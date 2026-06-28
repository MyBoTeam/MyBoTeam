import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataDirectoryManager } from '../../src/data-directory.js';

describe('Clean Operation Integration', () => {
  let tempDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myboteam-clean-'));
    process.env = { ...originalEnv };
    process.env.MYBOTEAM_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should remove entire data directory and all contents', async () => {
    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    const testFile = path.join(tempDir, 'data', 'test.txt');
    fs.writeFileSync(testFile, 'test content');

    await manager.clean();

    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it('should remove nested directories', async () => {
    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    const nestedDir = path.join(tempDir, 'data', 'nested', 'deep');
    fs.mkdirSync(nestedDir, { recursive: true });
    const nestedFile = path.join(nestedDir, 'file.txt');
    fs.writeFileSync(nestedFile, 'nested content');

    await manager.clean();

    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it('should not fail if directory does not exist', async () => {
    const manager = new DataDirectoryManager();
    await expect(manager.clean()).resolves.toBeUndefined();
  });

  it('should clean custom data directory', async () => {
    const customDir = path.join(tempDir, 'custom-clean');
    process.env.MYBOTEAM_DATA_DIR = customDir;

    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    const testFile = path.join(customDir, 'data', 'test.txt');
    fs.writeFileSync(testFile, 'test content');

    await manager.clean();

    expect(fs.existsSync(customDir)).toBe(false);
  });
});
