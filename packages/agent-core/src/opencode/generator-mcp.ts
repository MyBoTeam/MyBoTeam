import fs from 'node:fs';
import path from 'node:path';
import { MCP_TOOL_TIMEOUT_MS } from '../common/constants.js';
import { OPENCODE_SLACK_MCP_CLIENT_ID, OPENCODE_SLACK_MCP_SERVER_URL } from './auth-slack-mcp.js';
import type { BrowserConfig, McpServerConfig } from './generator-mcp-tools.js';
import { resolveMcpCommand } from './generator-mcp-tools.js';

export type { BrowserConfig, McpServerConfig } from './generator-mcp-tools.js';
export { resolveMcpCommand } from './generator-mcp-tools.js';

export interface BuildMcpServersOptions {
  mcpToolsPath: string;
  nodeExe: string;

  whatsappApiPort?: number;
  whatsappMcpPath?: string;
  browserConfig: BrowserConfig;

  authToken?: string;
  connectors?: Array<{
    id: string;
    name: string;
    url: string;
    accessToken: string;
  }>;

  gwsAccountsManifestPath?: string;
}

export function buildMcpServers(options: BuildMcpServersOptions): Record<string, McpServerConfig> {
  const {
    mcpToolsPath,
    nodeExe,
    whatsappApiPort,
    whatsappMcpPath,
    browserConfig,
    authToken,
    connectors,
    gwsAccountsManifestPath,
  } = options;

  const authEnv: Record<string, string> = authToken
    ? { MYBOTEAM_DAEMON_AUTH_TOKEN: authToken }
    : {};

  const mcpServers: Record<string, McpServerConfig> = {
    slack: {
      type: 'remote',
      url: OPENCODE_SLACK_MCP_SERVER_URL,
      oauth: { clientId: OPENCODE_SLACK_MCP_CLIENT_ID },
    },
    'request-connector-auth': {
      type: 'local',
      command: resolveMcpCommand(mcpToolsPath, 'request-connector-auth', 'dist/index.mjs', nodeExe),
      enabled: true,
      environment: { ...authEnv },
      timeout: MCP_TOOL_TIMEOUT_MS,
    },
    'complete-task': {
      type: 'local',
      command: resolveMcpCommand(mcpToolsPath, 'complete-task', 'dist/index.mjs', nodeExe),
      enabled: true,
      timeout: 30000,
    },
    'start-task': {
      type: 'local',
      command: resolveMcpCommand(mcpToolsPath, 'start-task', 'dist/index.mjs', nodeExe),
      enabled: true,
      timeout: 30000,
    },
  };

  if (whatsappApiPort) {
    if (whatsappMcpPath) {
      const distPath = path.join(whatsappMcpPath, 'dist', 'index.js');
      if (fs.existsSync(distPath)) {
        mcpServers.whatsapp = {
          type: 'local',
          command: [nodeExe, distPath],
          enabled: true,
          environment: {
            MYBOTEAM_WHATSAPP_API_PORT: String(whatsappApiPort),
            ...authEnv,
          },
          timeout: 30000,
        };
      }
    } else {
      mcpServers.whatsapp = {
        type: 'local',
        command: resolveMcpCommand(mcpToolsPath, 'whatsapp', 'dist/index.mjs', nodeExe),
        enabled: true,
        environment: {
          MYBOTEAM_WHATSAPP_API_PORT: String(whatsappApiPort),
          ...authEnv,
        },
        timeout: 30000,
      };
    }
  }

  if (browserConfig.mode !== 'none') {
    const browserEnv: Record<string, string> = {};
    if (browserConfig.mode === 'remote') {
      if (browserConfig.cdpEndpoint) {
        browserEnv.CDP_ENDPOINT = browserConfig.cdpEndpoint;
      }
      if (browserConfig.cdpHeaders) {
        for (const [key, value] of Object.entries(browserConfig.cdpHeaders)) {
          if (key.toLowerCase() === 'x-cdp-secret') {
            browserEnv.CDP_SECRET = value;
          }
        }
      }
    }
    mcpServers['dev-browser-mcp'] = {
      type: 'local',
      command: resolveMcpCommand(mcpToolsPath, 'dev-browser-mcp', 'dist/index.mjs', nodeExe),
      enabled: true,
      ...(Object.keys(browserEnv).length > 0 && { environment: browserEnv }),
      timeout: 30000,
    };
  }

  if (gwsAccountsManifestPath) {
    const gwsEnv = { GWS_ACCOUNTS_MANIFEST: gwsAccountsManifestPath };
    try {
      mcpServers['gmail-mcp'] = {
        type: 'local',
        command: resolveMcpCommand(mcpToolsPath, 'gmail-mcp', 'dist/index.mjs', nodeExe),
        enabled: true,
        environment: gwsEnv,
        timeout: 60000,
      };
    } catch {}
    try {
      mcpServers['calendar-mcp'] = {
        type: 'local',
        command: resolveMcpCommand(mcpToolsPath, 'calendar-mcp', 'dist/index.mjs', nodeExe),
        enabled: true,
        environment: gwsEnv,
        timeout: 60000,
      };
    } catch {}
    try {
      mcpServers['gws-mcp'] = {
        type: 'local',
        command: resolveMcpCommand(mcpToolsPath, 'gws-mcp', 'dist/index.mjs', nodeExe),
        enabled: true,
        environment: gwsEnv,
        timeout: 60000,
      };
    } catch {}
    try {
      mcpServers['request-google-file-picker'] = {
        type: 'local',
        command: resolveMcpCommand(
          mcpToolsPath,
          'request-google-file-picker',
          'dist/index.mjs',
          nodeExe,
        ),
        enabled: true,
        environment: gwsEnv,
        timeout: 30000,
      };
    } catch {}
  }

  if (connectors) {
    for (const connector of connectors) {
      const sanitized = connector.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20);
      const baseName = sanitized || 'mcp-remote';
      const idSuffix = connector.id.slice(0, 6);
      let key = `connector-${baseName}-${idSuffix}`;
      if (mcpServers[key]) {
        let i = 1;
        while (mcpServers[`${key}-${i}`]) {
          i += 1;
        }
        key = `${key}-${i}`;
      }
      mcpServers[key] = {
        type: 'remote',
        url: connector.url,
        headers: { Authorization: `Bearer ${connector.accessToken}` },
        enabled: true,
      };
    }
  }

  return mcpServers;
}
