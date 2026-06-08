import { homedir } from 'node:os';
import path from 'node:path';
import { getPidFilePath, getSocketPath } from '@myboteam/agent-core';
import { parseArgs } from './cli.js';
import { log } from './logger.js';

export const DRAIN_TIMEOUT_MS = 30_000;

export interface DaemonPaths {
  userDataPath: string;
  mcpToolsPath: string;
  mcpServersPath?: string;
  socketPath: string;
  bundledSkillsPath: string;
  pidPath: string;
  resourcesPath: string;
  appPath: string;
}

export interface DaemonArgs {
  version: boolean;
  dataDir: string | undefined;
  isPackaged: boolean;
  resourcesPath: string;
  appPath: string;
  socketPath: string | undefined;
  isDevMode: boolean;
}

export function parseDaemonArgs(): DaemonArgs {
  const args = parseArgs();

  if (args.version) {
    return {
      version: true,
      dataDir: undefined,
      isPackaged: false,
      resourcesPath: '',
      appPath: '',
      socketPath: undefined,
      isDevMode: false,
    };
  }

  const isDevMode = process.env.MYBOTEAM_DAEMON_DEV === '1';
  const dataDir = args.dataDir;

  if (!dataDir && !isDevMode) {
    log.error(
      '[Daemon] Error: --data-dir is required.\n' +
        'The daemon must know which data directory to use so it shares the same\n' +
        'database, socket, and PID file as the desktop app.\n\n' +
        'Usage: node daemon/index.js --data-dir /path/to/userData\n\n' +
        'For local development without --data-dir, set MYBOTEAM_DAEMON_DEV=1\n' +
        'to fall back to ~/.myboteam.',
    );
    process.exit(1);
  }

  if (!dataDir && isDevMode) {
    log.warn('[Daemon] Warning: running in dev mode without --data-dir, using ~/.myboteam');
  }

  return {
    version: false,
    dataDir,
    isDevMode,
    isPackaged: args.isPackaged || process.env.MYBOTEAM_IS_PACKAGED === '1',
    resourcesPath: args.resourcesPath || process.env.MYBOTEAM_RESOURCES_PATH || '',
    appPath: args.appPath || process.env.MYBOTEAM_APP_PATH || '',
    socketPath: args.socketPath,
  };
}

export function resolveDaemonPaths(args: DaemonArgs): DaemonPaths {
  const userDataPath = args.dataDir || path.join(homedir(), '.myboteam');
  const mcpToolsPath = args.isPackaged
    ? path.join(args.resourcesPath, 'mcp-tools')
    : process.env.MCP_TOOLS_PATH ||
      path.resolve(__dirname, '..', '..', '..', 'packages', 'agent-core', 'mcp-tools');
  const socketPath = args.socketPath || getSocketPath(args.dataDir);
  const pidPath = getPidFilePath(args.dataDir);
  const bundledSkillsPath = args.isPackaged
    ? path.join(args.resourcesPath, 'bundled-skills')
    : args.appPath
      ? path.join(args.appPath, 'bundled-skills')
      : path.resolve(__dirname, '..', '..', '..', 'bundled-skills');

  const mcpServersPath = args.isPackaged
    ? path.join(args.resourcesPath, 'mcp-servers', 'whatsapp')
    : path.resolve(__dirname, '..', '..', '..', 'packages', 'mcp-servers', 'whatsapp');

  return {
    userDataPath,
    mcpToolsPath,
    mcpServersPath,
    socketPath,
    bundledSkillsPath,
    pidPath,
    resourcesPath: args.resourcesPath,
    appPath: args.appPath,
  };
}

export function logStartupBanner(dataDir: string | undefined, pidPath: string): void {
  log.info(`[Daemon] Starting... (dataDir=${dataDir ?? '~/.myboteam (dev fallback)'})`);
  log.info(`[Daemon] PID lock acquired: ${pidPath} (pid=${process.pid})`);
}
