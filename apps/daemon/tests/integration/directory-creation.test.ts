import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataDirectoryManager } from '../../src/data-directory.js';

describe('Directory Creation Integration', () => {
  let tempDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myboteam-integration-'));
    process.env = { ...originalEnv };
    process.env.MYBOTEAM_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create complete directory structure on first run', async () => {
    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    expect(fs.existsSync(tempDir)).toBe(true);
    expect(fs.statSync(tempDir).isDirectory()).toBe(true);

    const subdirs = ['data', 'logs', 'vault'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(tempDir, subdir);
      expect(fs.existsSync(subdirPath)).toBe(true);
      expect(fs.statSync(subdirPath).isDirectory()).toBe(true);
    }
  });

  it('should preserve existing contents when directories already exist', async () => {
    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    const testFile = path.join(tempDir, 'data', 'existing.txt');
    fs.writeFileSync(testFile, 'existing content');

    await manager.ensureDirectories();

    expect(fs.existsSync(testFile)).toBe(true);
    expect(fs.readFileSync(testFile, 'utf-8')).toBe('existing content');
  });

  it('should handle custom data directory path', async () => {
    const customDir = path.join(tempDir, 'custom', 'location');
    process.env.MYBOTEAM_DATA_DIR = customDir;

    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    expect(fs.existsSync(customDir)).toBe(true);
    expect(fs.existsSync(path.join(customDir, 'data'))).toBe(true);
    expect(fs.existsSync(path.join(customDir, 'logs'))).toBe(true);
    expect(fs.existsSync(path.join(customDir, 'vault'))).toBe(true);
  });
});
