import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  type CliResolverConfig,
  isCliAvailable as coreIsCliAvailable,
  generateConfig,
  getBundledNodePaths,
  getEnabledSkills,
  getOpenCodeAuthJsonPath,
  type OnBeforeStartContext,
  resolveTaskConfig,
  type StorageAPI,
  syncApiKeysToOpenCodeAuth,
} from '@myboteam/agent-core';
import { getDatabase } from '@myboteam/agent-core/storage/database';
import { buildConfigFileName, getPort } from './task-config-builder-utils.js';

export interface TaskConfigBuilderOptions {
  userDataPath: string;
  mcpToolsPath: string;
  isPackaged: boolean;
  resourcesPath: string;
  appPath: string;
  mcpServersPath?: string;
}

export function getBundledNodeBinPath(opts: TaskConfigBuilderOptions): string | undefined {
  const paths = getBundledNodePaths({
    isPackaged: opts.isPackaged,
    resourcesPath: opts.resourcesPath,
    appPath: opts.appPath,
    userDataPath: opts.userDataPath,
    tempPath: tmpdir(),
    platform: process.platform,
    arch: process.arch,
  });
  return paths?.binDir;
}

export async function isCliAvailable(opts: TaskConfigBuilderOptions): Promise<boolean> {
  const cliConfig: CliResolverConfig = {
    isPackaged: opts.isPackaged,
    resourcesPath: opts.resourcesPath,
    appPath: opts.appPath,
  };
  return coreIsCliAvailable(cliConfig);
}

export async function onBeforeStart(
  storage: StorageAPI,
  opts: TaskConfigBuilderOptions,
  ctx: OnBeforeStartContext,
): Promise<{
  configPath: string;
  env: NodeJS.ProcessEnv;

  workspaceInstructions?: string;
}> {
  const authPath = getOpenCodeAuthJsonPath();
  const apiKeys = await storage.getAllApiKeys();
  await syncApiKeysToOpenCodeAuth(authPath, apiKeys);

  const whatsappApiPort = getPort('MYBOTEAM_WHATSAPP_API_PORT');

  const skills = getEnabledSkills();

  let database: ReturnType<typeof getDatabase> | undefined;
  try {
    database = getDatabase();
  } catch {
    database = undefined;
  }

  const { configOptions } = await resolveTaskConfig({
    storage,
    platform: process.platform,
    mcpToolsPath: opts.mcpToolsPath,
    userDataPath: opts.userDataPath,
    isPackaged: opts.isPackaged,
    bundledNodeBinPath: getBundledNodeBinPath(opts),
    getApiKey: (provider) => storage.getApiKey(provider),
    whatsappApiPort,
    whatsappMcpPath: opts.mcpServersPath,
    authToken: process.env.MYBOTEAM_DAEMON_AUTH_TOKEN,
    skills,
    workspaceId: ctx.workspaceId,
    configFileName: buildConfigFileName(ctx.taskId),
    database,
  });

  const result = generateConfig(configOptions);

  const env: NodeJS.ProcessEnv = {
    OPENCODE_CONFIG: result.configPath,
    OPENCODE_CONFIG_DIR: path.dirname(result.configPath),
  };
  const bundledNodeBinPath = getBundledNodeBinPath(opts);
  if (bundledNodeBinPath) {
    env.PATH = `${bundledNodeBinPath}${path.delimiter}${process.env.PATH ?? ''}`;
    if (process.platform === 'win32') {
      env.Path = env.PATH;
    }
  }

  return {
    configPath: result.configPath,
    env,
    ...(configOptions.knowledgeInstructions
      ? { workspaceInstructions: configOptions.knowledgeInstructions }
      : {}),
  };
}
export { createTaskCallbacks } from './task-callbacks.js';
export * from './task-service-helpers.js';
