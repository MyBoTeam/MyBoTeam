import { execSync } from 'node:child_process';
import type {
  SandboxConfig,
  SandboxPaths,
  SandboxProvider,
  SpawnArgs,
} from '../common/types/sandbox.js';
import { buildDockerArgs, redactDockerArgs } from './docker-args.js';

export class DockerSandboxProvider implements SandboxProvider {
  readonly name = 'docker';

  private readonly platform: NodeJS.Platform;
  private readonly getSandboxPaths?: () => SandboxPaths;

  constructor(platform?: NodeJS.Platform, getSandboxPaths?: () => SandboxPaths) {
    this.platform = platform ?? process.platform;
    this.getSandboxPaths = getSandboxPaths;
  }

  async isAvailable(): Promise<boolean> {
    if (this.platform !== 'darwin' && this.platform !== 'linux') {
      return false;
    }
    try {
      execSync('docker info', { stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async wrapSpawnArgs(args: SpawnArgs, config: SandboxConfig): Promise<SpawnArgs> {
    const sandboxEnv: Record<string, string> = {
      MYBOTEAM_SANDBOX_ENABLED: '1',
      MYBOTEAM_SANDBOX_MODE: 'docker',
    };
    const mergedEnv = { ...(args.env ?? {}), ...sandboxEnv };
    const dockerArgs = buildDockerArgs({ ...args, env: mergedEnv }, config, this.getSandboxPaths);

    return {
      file: 'docker',
      args: dockerArgs,
      cwd: args.cwd,
      env: mergedEnv,
    };
  }

  async dispose(): Promise<void> {}

  buildDockerArgs(spawnArgs: SpawnArgs, config: SandboxConfig): string[] {
    return buildDockerArgs(spawnArgs, config, this.getSandboxPaths);
  }

  redactDockerArgs(dockerArgs: string[]): string[] {
    return redactDockerArgs(dockerArgs);
  }
}
