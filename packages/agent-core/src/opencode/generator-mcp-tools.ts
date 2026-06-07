import fs from 'node:fs';
import path from 'node:path';

export interface BrowserConfig {
  mode: 'builtin' | 'remote' | 'none';
  cdpEndpoint?: string;
  cdpHeaders?: Record<string, string>;
  headless?: boolean;
}

export interface McpServerConfig {
  type?: 'local' | 'remote';
  command?: string[];
  url?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  environment?: Record<string, string>;
  timeout?: number;
  oauth?:
    | false
    | {
        clientId?: string;
        clientSecret?: string;
        scope?: string;
      };
}

export function resolveMcpCommand(
  mcpToolsPath: string,
  mcpName: string,
  distRelPath: string,
  nodePath: string,
): string[] {
  const mcpDir = path.join(mcpToolsPath, mcpName);
  const distPath = path.join(mcpDir, distRelPath);
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `[OpenCode Config] Missing MCP dist entry: ${distPath}. ` +
        'Run "pnpm -F @myboteam/desktop build:mcp-tools:dev" before launching.',
    );
  }
  return [nodePath, distPath];
}
