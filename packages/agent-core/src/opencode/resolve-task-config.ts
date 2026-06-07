import type { Skill } from '../common/types/skills.js';
import { type LogFn, prepareGwsManifest } from '../google-accounts/index.js';
import type { Database } from '../storage/database.js';
import { getFormattedKnowledgeNotes } from '../storage/repositories/knowledgeNotes.js';
import type { StorageAPI } from '../types/storage.js';
import { buildProviderConfigs } from './config-builder.js';
import type { ConfigGeneratorOptions } from './config-generator.js';
import type { MyboteamRuntime, StorageDeps } from './myboteam-runtime.js';
import {
  injectOpenAiStoreFlag,
  resolveCloudBrowser,
  resolveConnectors,
} from './resolve-task-config-utils.js';

export interface ResolveTaskConfigOptions {
  storage: StorageAPI;
  platform: NodeJS.Platform;
  mcpToolsPath: string;
  userDataPath: string;
  isPackaged: boolean;
  bundledNodeBinPath?: string;
  getApiKey: (provider: string) => string | null;
  azureFoundryToken?: string;
  whatsappApiPort?: number;
  authToken?: string;
  skills?: Skill[];
  workspaceId?: string;
  configFileName?: string;
  myboteamRuntime?: MyboteamRuntime;
  myboteamStorageDeps?: StorageDeps;
  database?: Database;
  log?: LogFn;
}

export interface ResolvedTaskConfig {
  configOptions: ConfigGeneratorOptions;
}

export async function resolveTaskConfig(
  options: ResolveTaskConfigOptions,
): Promise<ResolvedTaskConfig> {
  const {
    storage,
    platform,
    mcpToolsPath,
    userDataPath,
    isPackaged,
    bundledNodeBinPath,
    getApiKey,
    azureFoundryToken,
    whatsappApiPort,
    authToken,
    skills,
    workspaceId,
    configFileName,
    myboteamRuntime,
    myboteamStorageDeps,
    database,
  } = options;

  const log: LogFn = options.log ?? ((_level, _msg) => {});

  const { providerConfigs, enabledProviders, modelOverride } = await buildProviderConfigs({
    getApiKey,
    azureFoundryToken,
    myboteamRuntime,
    myboteamStorageDeps,
  });

  injectOpenAiStoreFlag(providerConfigs, getApiKey);
  const connectors = await resolveConnectors(storage, log);
  const browser = resolveCloudBrowser(storage);

  let knowledgeInstructions: string | undefined;
  let knowledgeContext: string | undefined;
  if (workspaceId) {
    try {
      const formatted = getFormattedKnowledgeNotes(workspaceId);
      if (formatted.instructions) knowledgeInstructions = formatted.instructions;
      if (formatted.context) knowledgeContext = formatted.context;
    } catch (error) {
      log('WARN', '[resolveTaskConfig] Failed to load workspace knowledge notes', {
        workspaceId,
        err: String(error),
      });
    }
  }

  let language: string | undefined;
  try {
    language = storage.getLanguage();
    if (typeof language === 'string' && language.trim().length === 0) {
      language = undefined;
    }
  } catch (_err) {}

  let gwsAccountsManifestPath: string | undefined;
  let gwsAccountsSummary: Array<{ label: string; email: string; status: string }> | undefined;
  if (database) {
    try {
      const gwsResult = await prepareGwsManifest(storage, database, userDataPath, log);
      if (gwsResult?.manifestPath) {
        gwsAccountsManifestPath = gwsResult.manifestPath;
      }
      if (gwsResult?.summary && gwsResult.summary.length > 0) {
        gwsAccountsSummary = gwsResult.summary.map((s) => ({
          label: s.label,
          email: s.email,
          status: s.status,
        }));
      }
    } catch (err) {
      log('WARN', '[resolveTaskConfig] GWS manifest step failed', { err: String(err) });
    }
  }

  return {
    configOptions: {
      platform,
      mcpToolsPath,
      userDataPath,
      isPackaged,
      bundledNodeBinPath,
      skills,
      providerConfigs,
      enabledProviders,
      whatsappApiPort,
      authToken,
      model: modelOverride?.model,
      smallModel: modelOverride?.smallModel,
      connectors: connectors.length > 0 ? connectors : undefined,
      browser,
      knowledgeInstructions,
      knowledgeContext,
      language,
      configFileName,
      gwsAccountsManifestPath,
      gwsAccountsSummary,
    },
  };
}
