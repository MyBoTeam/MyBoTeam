export type SandboxMode = 'disabled' | 'native' | 'docker';

export interface SandboxNetworkPolicy {
  allowOutbound: boolean;

  allowedHosts?: string[];
}

export interface SandboxPaths {
  configDir: string;

  openDataHome: string;
}

export interface SandboxConfig {
  mode: SandboxMode;

  allowedPaths: string[];

  networkRestricted: boolean;

  allowedHosts: string[];

  dockerImage?: string;

  networkPolicy?: SandboxNetworkPolicy;
}

export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  mode: 'disabled',
  allowedPaths: [],
  networkRestricted: false,
  allowedHosts: [],
  dockerImage: undefined,
  networkPolicy: { allowOutbound: true },
};

export interface SpawnArgs {
  file: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
}

export interface SandboxProvider {
  readonly name: string;

  isAvailable(): Promise<boolean>;

  wrapSpawnArgs(args: SpawnArgs, config: SandboxConfig): Promise<SpawnArgs>;

  dispose(): Promise<void>;
}
