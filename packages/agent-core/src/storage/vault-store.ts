import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface VaultStoreConfig {
  dataDir: string;
  fileName: string;
}

export class VaultStore {
  private filePath: string;

  constructor(config: VaultStoreConfig) {
    this.filePath = join(config.dataDir, config.fileName);
  }

  async read(): Promise<string | null> {
    try {
      if (!existsSync(this.filePath)) {
        return null;
      }
      return await readFile(this.filePath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async write(data: string): Promise<void> {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const tempPath = `${this.filePath}.temp`;

    try {
      await writeFile(tempPath, data, 'utf-8');
      await rename(tempPath, this.filePath);
    } catch (error) {
      if (existsSync(tempPath)) {
        await unlink(tempPath).catch(() => {});
      }
      throw error;
    }
  }

  async exists(): Promise<boolean> {
    return existsSync(this.filePath);
  }

  async delete(): Promise<void> {
    if (existsSync(this.filePath)) {
      await unlink(this.filePath);
    }
  }

  getFilePath(): string {
    return this.filePath;
  }
}
