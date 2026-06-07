import path from 'node:path';
import type { SandboxConfig, SandboxPaths, SpawnArgs } from '../common/types/sandbox.js';
import { createConsoleLogger } from '../utils/logging.js';

const log = createConsoleLogger({ prefix: 'DockerProvider' });

export const FORWARDED_ENV_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'XAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'OPENROUTER_API_KEY',
  'OPENAI_BASE_URL',
  'MYBOTEAM_TASK_ID',

  'MYBOTEAM_SANDBOX_MODE',
  'MYBOTEAM_SANDBOX_ENABLED',
  'LANG',
  'LC_ALL',
  'TERM',
  'COLORTERM',
  'NO_COLOR',
];

export function buildDockerArgs(
  spawnArgs: SpawnArgs,
  config: SandboxConfig,
  getSandboxPaths?: () => SandboxPaths,
): string[] {
  const safeCwd = path.resolve(spawnArgs.cwd);
  const dockerArgs: string[] = ['run', '--rm', '-i'];

  dockerArgs.push('-v', `${safeCwd}:/workspace`, '-w', '/workspace');

  for (const p of config.allowedPaths) {
    dockerArgs.push('-v', `${p}:${p}`);
  }

  if (getSandboxPaths) {
    const paths = getSandboxPaths();
    dockerArgs.push(
      '-v',
      `${path.resolve(paths.configDir)}:/opencode-config:ro`,
      '-v',
      `${path.resolve(paths.openDataHome)}:/xdg-data:ro`,
      '-e',
      'OPENCODE_CONFIG=/opencode-config/opencode.json',
      '-e',
      'OPENCODE_CONFIG_DIR=/opencode-config',
      '-e',
      'XDG_DATA_HOME=/xdg-data',
    );
  }

  const netPolicy = config.networkPolicy;
  if (netPolicy && !netPolicy.allowOutbound) {
    dockerArgs.push('--network', 'none');
  } else if (config.networkRestricted) {
    dockerArgs.push('--network', 'none');
  }

  const hasAllowedHosts =
    (config.allowedHosts && config.allowedHosts.length > 0) ||
    (netPolicy?.allowedHosts && netPolicy.allowedHosts.length > 0);
  if (hasAllowedHosts) {
    log.warn(
      '[DockerProvider] allowedHosts is set but Docker mode does not support per-host allowlists. The allowedHosts restriction will be ignored.',
    );
  }

  for (const key of FORWARDED_ENV_KEYS) {
    const val = spawnArgs.env[key];
    if (val) {
      dockerArgs.push('-e', `${key}=${val}`);
    }
  }

  const image = config.dockerImage || 'node:20-slim';
  dockerArgs.push(image);

  const containerCommand = path.basename(spawnArgs.file);
  const innerCmd = buildShellCommand(containerCommand, spawnArgs.args);
  dockerArgs.push('sh', '-c', innerCmd);

  return dockerArgs;
}

export function redactDockerArgs(dockerArgs: string[]): string[] {
  return dockerArgs.map((arg, i) => {
    if (i > 0 && dockerArgs[i - 1] === '-e' && arg.includes('=')) {
      const eqIdx = arg.indexOf('=');
      return `${arg.substring(0, eqIdx)}=***`;
    }
    return arg;
  });
}

function buildShellCommand(command: string, args: string[]): string {
  const parts = [command, ...args].map((a) => escapeShellArg(a));
  return parts.join(' ');
}

function escapeShellArg(arg: string): string {
  if (arg === '') {
    return "''";
  }
  const needsEscaping = ["'", ' ', '$', '`', '\\', '"', '\n'].some((c) => arg.includes(c));
  if (needsEscaping) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
  return arg;
}
