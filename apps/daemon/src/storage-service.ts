import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createStorage, type StorageAPI } from '@myboteam/agent-core';
import type { Database } from '@myboteam/agent-core/storage/database';

import { getDatabase } from '@myboteam/agent-core/storage/database';
import { log } from './logger.js';

const DEV_DEFAULT_DATA_DIR = join(homedir(), '.myboteam');

export class StorageService {
  private storage: StorageAPI | null = null;

  async initialize(dataDir?: string): Promise<StorageAPI> {
    const dir = dataDir || DEV_DEFAULT_DATA_DIR;
    mkdirSync(dir, { recursive: true, mode: 0o700 });

    const isPackaged = process.env.MYBOTEAM_IS_PACKAGED === '1';
    const dbName = isPackaged ? 'myboteam.db' : 'myboteam-dev.db';
    const secureFileName = isPackaged ? 'secure-storage.json' : 'secure-storage-dev.json';
    const databasePath = join(dir, dbName);

    this.storage = createStorage({
      databasePath,
      runMigrations: true,
      userDataPath: dir,
      secureStorageFileName: secureFileName,
    });

    await this.storage.initialize();
    log.info(`[StorageService] Database initialized at ${databasePath}`);

    return this.storage;
  }

  getStorage(): StorageAPI {
    if (!this.storage) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  getRawDatabase(): Database {
    if (!this.storage) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return getDatabase();
  }

  close(): void {
    if (this.storage) {
      this.storage.close();
      this.storage = null;
      log.info('[StorageService] Database closed');
    }
  }
}
