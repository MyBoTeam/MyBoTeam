/**
 * Regression tests for `StorageService` bootstrap.
 *
 * The sql.js migration consolidated all workspace tables into `myboteam.db`
 * (the legacy `workspace-meta.db` sibling is gone). This test verifies the
 * post-migration contract:
 *
 *   1. `StorageService.initialize(dataDir)` calls `createStorage` with
 *      `databasePath` pointing at the expected filename under `dataDir`
 *      (dev vs packaged).
 *   2. `storage.initialize()` is invoked and the lifecycle methods
 *      (`close`, `getStorage`, `getRawDatabase`) behave correctly.
 *
 * sql.js WASM bindings can't be loaded in the daemon vitest environment
 * (NODE_MODULE_VERSION mismatch against Electron's bundled Node), so we
 * mock `createStorage` from `@myboteam/agent-core` and the
 * `getDatabase` export. The real helpers are covered by agent-core's
 * integration suite.
 */

import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createStorageSpy = vi.fn();
const storageInitializeSpy = vi.fn();
const storageCloseSpy = vi.fn();

vi.mock('@myboteam/agent-core', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createStorage: vi.fn((options: Record<string, unknown>) => {
      createStorageSpy(options);
      return {
        initialize: storageInitializeSpy,
        close: storageCloseSpy,
      };
    }),
  };
});

vi.mock('@myboteam/agent-core/storage/database', () => ({
  getDatabase: vi.fn(() => ({})),
}));

const { StorageService } = await import('../../src/storage-service.js');

describe('StorageService bootstrap — consolidated workspace-meta', () => {
  let dataDir: string;

  beforeEach(() => {
    createStorageSpy.mockClear();
    storageInitializeSpy.mockClear();
    storageCloseSpy.mockClear();
    delete process.env.MYBOTEAM_IS_PACKAGED;
    dataDir = join(tmpdir(), `storage-svc-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  });

  afterEach(() => {
    delete process.env.MYBOTEAM_IS_PACKAGED;
    try {
      rmSync(dataDir, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  });

  it('falls back to default data dir when no dataDir is passed', async () => {
    const svc = new StorageService();
    await svc.initialize();

    expect(createStorageSpy).toHaveBeenCalledTimes(1);
    const opts = createStorageSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.databasePath).toContain('.myboteam');
    expect(opts.databasePath).toContain('myboteam-dev.db');
  });

  it('passes databasePath to createStorage in dev mode', async () => {
    const svc = new StorageService();
    await svc.initialize(dataDir);

    expect(createStorageSpy).toHaveBeenCalledTimes(1);
    expect(storageInitializeSpy).toHaveBeenCalled();
    const opts = createStorageSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.databasePath).toBe(join(dataDir, 'myboteam-dev.db'));
    expect(opts.runMigrations).toBe(true);
    expect(opts.userDataPath).toBe(dataDir);
    expect(opts.secureStorageFileName).toBe('secure-storage-dev.json');
  });

  it('uses packaged file names when MYBOTEAM_IS_PACKAGED=1', async () => {
    process.env.MYBOTEAM_IS_PACKAGED = '1';
    const svc = new StorageService();
    await svc.initialize(dataDir);

    const opts = createStorageSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.databasePath).toBe(join(dataDir, 'myboteam.db'));
    expect(opts.secureStorageFileName).toBe('secure-storage.json');
  });

  it('close() tears down the main storage', async () => {
    const svc = new StorageService();
    await svc.initialize(dataDir);
    svc.close();

    expect(storageCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('close() is a no-op when initialize() was never called', () => {
    const svc = new StorageService();
    svc.close();
    expect(storageCloseSpy).not.toHaveBeenCalled();
  });

  it('getStorage() throws when not initialized', () => {
    const svc = new StorageService();
    expect(() => svc.getStorage()).toThrow('Storage not initialized');
  });

  it('getStorage() returns storage after initialize', async () => {
    const svc = new StorageService();
    await svc.initialize(dataDir);
    const storage = svc.getStorage();
    expect(storage).toBeDefined();
    expect(storage.initialize).toBe(storageInitializeSpy);
  });

  it('getRawDatabase() throws when not initialized', () => {
    const svc = new StorageService();
    expect(() => svc.getRawDatabase()).toThrow('Storage not initialized');
  });

  it('getRawDatabase() returns database handle after initialize', async () => {
    const svc = new StorageService();
    await svc.initialize(dataDir);
    const db = svc.getRawDatabase();
    expect(db).toBeDefined();
  });
});
