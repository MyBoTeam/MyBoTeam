import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataDirectoryManager } from '../../src/data-directory.js';

describe('Custom Path Integration', () => {
  let tempDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myboteam-custom-'));
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should use custom data directory from MYBOTEAM_DATA_DIR', async () => {
    const customDir = path.join(tempDir, 'custom');
    process.env.MYBOTEAM_DATA_DIR = customDir;

    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    expect(fs.existsSync(customDir)).toBe(true);
    expect(fs.existsSync(path.join(customDir, 'data'))).toBe(true);
    expect(fs.existsSync(path.join(customDir, 'logs'))).toBe(true);
    expect(fs.existsSync(path.join(customDir, 'vault'))).toBe(true);
  });

  it('should handle relative path in MYBOTEAM_DATA_DIR', async () => {
    process.env.MYBOTEAM_DATA_DIR = 'relative/path';

    const manager = new DataDirectoryManager();
    await manager.ensureDirectories();

    const expectedDir = path.resolve(process.cwd(), 'relative/path');
    expect(fs.existsSync(expectedDir)).toBe(true);

    fs.rmSync(expectedDir, { recursive: true, force: true });
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
