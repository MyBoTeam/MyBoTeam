import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataDirectoryManager } from '../src/data-directory.js';

describe('DataDirectoryManager', () => {
  let tempDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myboteam-test-'));
    process.env = { ...originalEnv };
    process.env.MYBOTEAM_DATA_DIR = tempDir;
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('ensureDirectories', () => {
    it('should create data directory and subdirectories', async () => {
      const manager = new DataDirectoryManager();
      await manager.ensureDirectories();

      expect(fs.existsSync(tempDir)).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'data'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'logs'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'vault'))).toBe(true);
    });

    it('should not fail if directories already exist', async () => {
      fs.mkdirSync(path.join(tempDir, 'data'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'logs'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'vault'), { recursive: true });

      const manager = new DataDirectoryManager();
      await expect(manager.ensureDirectories()).resolves.toBeUndefined();
    });

    it('should be idempotent - running twice preserves existing contents', async () => {
      const manager = new DataDirectoryManager();
      await manager.ensureDirectories();

      const testFile = path.join(tempDir, 'data', 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      await manager.ensureDirectories();

      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile, 'utf-8')).toBe('test content');
    });
  });

  describe('clean', () => {
    it('should remove data directory and all contents', async () => {
      const manager = new DataDirectoryManager();
      await manager.ensureDirectories();

      const testFile = path.join(tempDir, 'data', 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      await manager.clean();

      expect(fs.existsSync(tempDir)).toBe(false);
    });

    it('should not fail if directory does not exist', async () => {
      const manager = new DataDirectoryManager();
      await expect(manager.clean()).resolves.toBeUndefined();
    });
  });
});
