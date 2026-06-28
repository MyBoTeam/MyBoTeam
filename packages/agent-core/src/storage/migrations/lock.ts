/**
 * Migration Lock Mechanism
 * File-based lock with timeout and stale lock recovery
 */

import type { LockInfo, Logger } from './types.js';

export class MigrationLock {
  private lockFilePath: string;
  private lockTimeout: number;
  private logger: Logger;

  constructor(lockFilePath: string, lockTimeout: number, logger: Logger) {
    this.lockFilePath = lockFilePath;
    this.lockTimeout = lockTimeout;
    this.logger = logger;
  }

  /**
   * Acquire lock for migration execution
   */
  async acquire(): Promise<boolean> {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const lockDir = path.dirname(this.lockFilePath);
    await fs.mkdir(lockDir, { recursive: true });

    const lockInfo: LockInfo = {
      pid: process.pid,
      acquiredAt: new Date().toISOString(),
      timeout: this.lockTimeout,
    };

    try {
      await fs.writeFile(this.lockFilePath, JSON.stringify(lockInfo), {
        flag: 'wx',
      });
      this.logger.debug(`Lock acquired by process ${process.pid}`);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        return await this.checkStale();
      }
      throw error;
    }
  }

  /**
   * Check if existing lock is stale and can be recovered
   */
  private async checkStale(): Promise<boolean> {
    const fs = await import('node:fs/promises');

    try {
      const lockContent = await fs.readFile(this.lockFilePath, 'utf-8');
      const lockInfo: LockInfo = JSON.parse(lockContent);

      const lockAge = Date.now() - new Date(lockInfo.acquiredAt).getTime();

      if (lockAge > lockInfo.timeout) {
        this.logger.warn(`Stale lock detected (age: ${lockAge}ms). Recovering...`);
        await this.release();
        return await this.acquire();
      }

      this.logger.debug(`Lock held by process ${lockInfo.pid} (age: ${lockAge}ms)`);
      return false;
    } catch {
      this.logger.warn('Corrupted lock file detected. Removing...');
      await this.release();
      return await this.acquire();
    }
  }

  /**
   * Release migration lock
   */
  async release(): Promise<void> {
    const fs = await import('node:fs/promises');

    try {
      await fs.unlink(this.lockFilePath);
      this.logger.debug('Lock released');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
