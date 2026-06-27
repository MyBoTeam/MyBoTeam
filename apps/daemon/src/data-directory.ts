import * as fs from 'node:fs';
import * as path from 'node:path';
import lockfile from 'proper-lockfile';
import { PathResolver } from './path-resolver.js';

export class DataDirectoryManager {
  private pathResolver: PathResolver;
  private subdirectories: string[] = ['data', 'logs', 'vault'];

  constructor() {
    this.pathResolver = new PathResolver();
  }

  async ensureDirectories(): Promise<void> {
    const dataDir = this.pathResolver.getDataDir();
    let release: (() => Promise<void>) | null = null;

    try {
      const parentDir = path.dirname(dataDir);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      release = await lockfile.lock(dataDir, {
        retries: { retries: 3, factor: 2, minTimeout: 100 },
        realpath: false,
      });

      for (const subdir of this.subdirectories) {
        const subdirPath = path.join(dataDir, subdir);
        if (!fs.existsSync(subdirPath)) {
          fs.mkdirSync(subdirPath, { recursive: true });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
          console.error(`Permission denied: Cannot create data directory at ${dataDir}`);
          console.error(
            'Please check your permissions or set MYBOTEAM_DATA_DIR to a writable location.',
          );
        } else if (error.message.includes('ENOSPC')) {
          console.error(`Disk full: Cannot create data directory at ${dataDir}`);
          console.error(
            'Please free up disk space or set MYBOTEAM_DATA_DIR to a different location.',
          );
        } else {
          console.error(`Failed to create data directory: ${error.message}`);
        }
      }
      throw error;
    } finally {
      if (release) {
        await release();
      }
    }
  }

  async clean(): Promise<void> {
    const dataDir = this.pathResolver.getDataDir();
    let release: (() => Promise<void>) | null = null;

    if (fs.existsSync(dataDir)) {
      try {
        release = await lockfile.lock(dataDir, {
          retries: { retries: 3, factor: 2, minTimeout: 100 },
          realpath: false,
        });
        fs.rmSync(dataDir, { recursive: true, force: true });
      } finally {
        if (release) {
          await release();
        }
      }
    }
  }

  getPathResolver(): PathResolver {
    return this.pathResolver;
  }
}
