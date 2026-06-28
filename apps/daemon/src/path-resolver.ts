import * as os from 'node:os';
import * as path from 'node:path';
import { getPidFilePath } from '@myboteam/agent-core/daemon';

export class PathResolver {
  private dataDir: string;
  private socketPath: string;
  private skillsDir: string;
  private pidFilePath: string;

  constructor() {
    this.dataDir = this.resolveDataDir();
    this.socketPath = this.resolveSocketPath();
    this.skillsDir = this.resolveSkillsDir();
    this.pidFilePath = getPidFilePath(this.dataDir);
  }

  private resolveDataDir(): string {
    const customDir = process.env.MYBOTEAM_DATA_DIR;
    if (customDir) {
      if (customDir.trim() === '') {
        throw new Error('MYBOTEAM_DATA_DIR cannot be empty');
      }
      return path.isAbsolute(customDir) ? customDir : path.resolve(process.cwd(), customDir);
    }
    return path.join(os.homedir(), '.myboteam');
  }

  private resolveSocketPath(): string {
    if (process.platform === 'win32') {
      return `\\\\.\\pipe\\myboteam-${process.pid}`;
    }
    return path.join(this.dataDir, 'myboteam.sock');
  }

  private resolveSkillsDir(): string {
    return path.join(this.dataDir, 'skills');
  }

  getDataDir(): string {
    return this.dataDir;
  }

  getSocketPath(): string {
    return this.socketPath;
  }

  getSkillsDir(): string {
    return this.skillsDir;
  }

  getPidFilePath(): string {
    return this.pidFilePath;
  }
}
