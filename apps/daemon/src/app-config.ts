import { homedir } from 'node:os';
import path from 'node:path';
import {
  getPidFilePath,
  getSocketPath,
  type MyboteamRuntime,
  noopRuntime,
} from '@myboteam/agent-core';
import { parseArgs } from './cli.js';
import { log } from './logger.js';

export const DRAIN_TIMEOUT_MS = 30_000;

export interface DaemonPaths {
  userDataPath: string;
  mcpToolsPath: string;
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

export interface OptionalRuntime {
  myboteamRuntime: MyboteamRuntime;
  setProxyTaskId: ((taskId: string | undefined) => void) | undefined;
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

  return {
    userDataPath,
    mcpToolsPath,
    socketPath,
    bundledSkillsPath,
    pidPath,
    resourcesPath: args.resourcesPath,
    appPath: args.appPath,
  };
}

export async function loadOptionalRuntime(): Promise<OptionalRuntime> {
  let myboteamRuntime: MyboteamRuntime = noopRuntime;
  try {
    const mod = await import('@myboteam/llm-gateway-client');
    myboteamRuntime = mod.createRuntime();
  } catch (err: unknown) {
    const isTargetPackageMissing =
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'ERR_MODULE_NOT_FOUND' &&
      String(err).includes("Cannot find package '@myboteam/llm-gateway-client'");
    if (isTargetPackageMissing) {
      log.info('[Daemon] @myboteam/llm-gateway-client not installed \u2014 OSS mode');
    } else {
      throw err;
    }
  }

  let setProxyTaskId: ((taskId: string | undefined) => void) | undefined;
  const OPTIONAL_RUNTIME_MODULE = '@myboteam/llm-gateway-client';
  try {
    const runtimeMod = require(OPTIONAL_RUNTIME_MODULE) as {
      setProxyTaskId?: (taskId: string | undefined) => void;
    };
    if (typeof runtimeMod.setProxyTaskId === 'function') {
      setProxyTaskId = runtimeMod.setProxyTaskId;
      log.info('[Daemon] optional runtime detected; proxy task-tagging wired');
    } else {
      log.warn(
        '[Daemon] optional runtime resolved but exports no setProxyTaskId function \u2014 proxy task-tagging stays unwired. Check the package build.',
      );
    }
  } catch (err) {
    const isPackageMissing =
      err instanceof Error &&
      ('code' in err ? (err as { code: string }).code === 'MODULE_NOT_FOUND' : false) &&
      String(err).includes(`Cannot find module '${OPTIONAL_RUNTIME_MODULE}'`);
    if (!isPackageMissing) {
      log.error(
        `[Daemon] optional runtime present but failed to load: ${err instanceof Error ? err.message : String(err)}. Proxy task-tagging stays unwired.`,
      );
    }
  }

  return { myboteamRuntime, setProxyTaskId };
}

export function logStartupBanner(dataDir: string | undefined, pidPath: string): void {
  log.info(`[Daemon] Starting... (dataDir=${dataDir ?? '~/.myboteam (dev fallback)'})`);
  log.info(`[Daemon] PID lock acquired: ${pidPath} (pid=${process.pid})`);
}
