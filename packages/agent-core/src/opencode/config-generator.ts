import fs from 'node:fs';
import path from 'node:path';
import { createConsoleLogger } from '../utils/logging.js';
import { formatBuiltInConnectorStatusSection } from './completion/context-providers/connector-status.js';
import {
  DEFAULT_CONFIG_FILE_NAME,
  MYBOTEAM_AGENT_NAME,
  MYBOTEAM_PERMISSION_POLICY,
} from './config-generator-options.js';
import {
  buildGwsSection,
  buildSkillsSection,
  buildWorkspaceInstructions,
  buildWorkspaceKnowledge,
  getLanguageInstruction,
} from './config-generator-templates.js';
import type {
  AgentConfig,
  ConfigGeneratorOptions,
  GeneratedConfig,
  OpenCodeConfigFile,
  ProviderConfig,
} from './config-generator-types.js';
import { BASE_PROVIDERS, getBrowserBehaviorInstructions } from './config-generator-types.js';
import { buildMcpServers } from './generator-mcp.js';
import {
  getPlatformEnvironmentInstructions,
  MYBOTEAM_SYSTEM_PROMPT_TEMPLATE,
} from './system-prompt.js';

export { MYBOTEAM_AGENT_NAME } from './config-generator-options.js';
export type {
  AgentConfig,
  ConfigGeneratorOptions,
  GeneratedConfig,
  OpenCodeConfigFile,
  ProviderConfig,
  ProviderModelConfig,
} from './config-generator-types.js';
export type { BrowserConfig, McpServerConfig } from './generator-mcp.js';

const log = createConsoleLogger({ prefix: 'OpenCodeConfig' });

function syncPermissionPolicyIntoDefaultConfig(configDir: string, activeConfigPath: string): void {
  const defaultConfigPath = path.join(configDir, DEFAULT_CONFIG_FILE_NAME);
  if (path.resolve(defaultConfigPath) === path.resolve(activeConfigPath)) {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== 'object') {
    return;
  }
  const maybeConfig = parsed as { permission?: unknown };
  if (!maybeConfig.permission || typeof maybeConfig.permission !== 'object') {
    maybeConfig.permission = { ...MYBOTEAM_PERMISSION_POLICY };
  } else {
    const permission = maybeConfig.permission as Record<string, unknown>;
    delete permission['*'];
    Object.assign(permission, MYBOTEAM_PERMISSION_POLICY);
  }
  fs.writeFileSync(defaultConfigPath, JSON.stringify(parsed, null, 2));
  log.info(`[OpenCode Config] Synced permission policy into: ${defaultConfigPath}`);
}

export function generateConfig(options: ConfigGeneratorOptions): GeneratedConfig {
  const {
    platform,
    mcpToolsPath,
    skills = [],
    bundledNodeBinPath,
    providerConfigs = [],
    whatsappApiPort,
    userDataPath,
    model,
    smallModel,
    enabledProviders: customEnabledProviders,
    gwsAccountsManifestPath,
    gwsAccountsSummary,
  } = options;

  const environmentInstructions = getPlatformEnvironmentInstructions(platform);
  let systemPrompt = MYBOTEAM_SYSTEM_PROMPT_TEMPLATE.replace(
    /\{\{ENVIRONMENT_INSTRUCTIONS\}\}/g,
    environmentInstructions,
  ).replace(/\{\{LANGUAGE_INSTRUCTION\}\}/g, getLanguageInstruction(options.language));

  if (skills.length > 0) {
    systemPrompt += buildSkillsSection(skills);
  }
  if (gwsAccountsManifestPath && gwsAccountsSummary && gwsAccountsSummary.length > 0) {
    systemPrompt += buildGwsSection(gwsAccountsSummary);
  }
  if (options.knowledgeInstructions) {
    systemPrompt = buildWorkspaceInstructions(options.knowledgeInstructions) + systemPrompt;
  }
  if (options.knowledgeContext) {
    systemPrompt += buildWorkspaceKnowledge(options.knowledgeContext);
  }
  if (options.builtInConnectorStatuses && options.builtInConnectorStatuses.length > 0) {
    systemPrompt += formatBuiltInConnectorStatusSection(options.builtInConnectorStatuses);
  }
  if (!bundledNodeBinPath) {
    throw new Error(
      '[OpenCode Config] Missing bundled Node.js path; cannot launch MCP tools. ' +
        'Run "pnpm -F @myboteam/desktop download:nodejs" and rebuild artifacts.',
    );
  }
  const nodeExe = path.join(bundledNodeBinPath, platform === 'win32' ? 'node.exe' : 'node');
  if (!fs.existsSync(nodeExe)) {
    throw new Error(`[OpenCode Config] Missing bundled Node.js executable: ${nodeExe}`);
  }
  const browserConfig = options.browser ?? { mode: 'builtin' as const };
  const mcpServers = buildMcpServers({
    mcpToolsPath,
    nodeExe,
    whatsappApiPort,
    browserConfig,
    authToken: options.authToken,
    connectors: options.connectors,
    gwsAccountsManifestPath,
  });
  const hasBrowser = browserConfig.mode !== 'none';
  systemPrompt = systemPrompt
    .replace('{{AGENT_ROLE}}', hasBrowser ? 'browser automation' : 'task automation')
    .replace(
      '{{BROWSER_CAPABILITY}}',
      hasBrowser
        ? '- **Browser Automation**: Control web browsers, navigate sites, fill forms, click buttons\n'
        : '',
    )
    .replace('{{BROWSER_BEHAVIOR}}', hasBrowser ? getBrowserBehaviorInstructions() : '');
  const providerConfig: Record<string, Omit<ProviderConfig, 'id'>> = {};
  for (const provider of providerConfigs) {
    const { id, ...rest } = provider;
    providerConfig[id] = rest;
  }
  let enabledProviders: string[];
  if (customEnabledProviders) {
    enabledProviders = [...new Set([...customEnabledProviders, ...Object.keys(providerConfig)])];
  } else {
    enabledProviders = [...new Set([...BASE_PROVIDERS, ...Object.keys(providerConfig)])];
  }
  const config: OpenCodeConfigFile = {
    $schema: 'https://opencode.ai/config.json',
    ...(model && { model }),
    ...(smallModel && { small_model: smallModel }),
    default_agent: MYBOTEAM_AGENT_NAME,
    enabled_providers: enabledProviders,
    permission: { ...MYBOTEAM_PERMISSION_POLICY },
    provider: Object.keys(providerConfig).length > 0 ? providerConfig : undefined,
    plugin: ['@tarquinen/opencode-dcp@^2.0.0'],
    agent: {
      [MYBOTEAM_AGENT_NAME]: {
        description: 'Browser automation assistant using dev-browser',
        prompt: systemPrompt,
        mode: 'primary',
      } as AgentConfig,
    },
    mcp: mcpServers,
    experimental: {
      mcp_timeout: 600000,
    },
  };
  const configDir = path.join(userDataPath, 'opencode');
  const configFileName = options.configFileName ?? DEFAULT_CONFIG_FILE_NAME;
  const configPath = path.join(configDir, configFileName);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  const configJson = JSON.stringify(config, null, 2);
  fs.writeFileSync(configPath, configJson);
  syncPermissionPolicyIntoDefaultConfig(configDir, configPath);
  log.info(`[OpenCode Config] Generated config at: ${configPath}`);
  const environment: Record<string, string> = {
    OPENCODE_CONFIG: configPath,
    OPENCODE_CONFIG_DIR: configDir,
  };
  if (bundledNodeBinPath) {
    environment.NODE_BIN_PATH = bundledNodeBinPath;
  }
  return { systemPrompt, mcpServers, environment, config, configPath };
}

export function getOpenCodeConfigPath(userDataPath: string): string {
  return path.join(userDataPath, 'opencode', 'opencode.json');
}
