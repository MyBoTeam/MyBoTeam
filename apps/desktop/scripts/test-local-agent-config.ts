import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_LOCAL_AGENT_HTTP_PORT = 9226;
const TEST_LOCAL_AGENT_CDP_PORT = 9227;
const TEST_LOCAL_AGENT_CHROME_PROFILE = path.join(
  os.homedir(),
  '.myboteam-test-local-agent-chrome',
);

                                                                       
                                                                     
                                                                     
                                                                         

interface McpServerConfig {
  type?: 'local' | 'remote';
  command?: string[];
  enabled?: boolean;
  environment?: Record<string, string>;
  timeout?: number;
}

interface OpenCodeConfig {
  $schema?: string;
  model?: string;
  default_agent?: string;
  enabled_providers?: string[];
  permission?: string;
  agent?: Record<string, { description?: string; prompt?: string; mode?: string }>;
  mcp?: Record<string, McpServerConfig>;
  provider?: Record<string, unknown>;
}

function getMcpToolsPath(): string {
  return path.resolve(__dirname, '..', '..', '..', 'packages', 'core', 'mcp-tools');
}

function getSystemPrompt(): string {
  const platformInstructions =
    process.platform === 'darwin'
      ? 'You are running on macOS.'
      : process.platform === 'win32'
        ? 'You are running on Windows. Use PowerShell syntax.'
        : 'You are running on Linux.';

  return `<identity>
You are MyBoTeam, a browser automation assistant.
</identity>

<environment>
${platformInstructions}
</environment>

<capabilities>
When users ask about your capabilities, mention:
- **Browser Automation**: Control web browsers, navigate sites, fill forms, click buttons
- **File Management**: Sort, rename, and move files based on content or rules
</capabilities>

<behavior>
- Use MCP tools directly - browser_navigate, browser_snapshot, browser_click, browser_type
- NEVER use shell commands to open browsers - ALL browser operations MUST use browser_* MCP tools
- After each action, evaluate the result before deciding next steps
</behavior>
`;
}

export function generateTestLocalAgentConfig(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.opencode');
  const configPath = path.join(configDir, 'opencode-test-local-agent.json');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  if (!fs.existsSync(TEST_LOCAL_AGENT_CHROME_PROFILE)) {
    fs.mkdirSync(TEST_LOCAL_AGENT_CHROME_PROFILE, { recursive: true });
  }

  const mcpToolsPath = getMcpToolsPath();

  const config: OpenCodeConfig = {
    $schema: 'https://opencode.ai/config.json',
    default_agent: 'myboteam',
    enabled_providers: ['anthropic', 'openai', 'google', 'xai'],
    permission: 'allow',
    agent: {
      myboteam: {
        description: 'Browser automation assistant for test local agent',
        prompt: getSystemPrompt(),
        mode: 'primary',
      },
    },
    mcp: {
                                                             
                                                                        
                                                                            
                                                                                 
      'dev-browser-mcp': {
        type: 'local',
        command: ['npx', 'tsx', path.join(mcpToolsPath, 'dev-browser-mcp', 'src', 'index.ts')],
        enabled: true,
        environment: {
          DEV_BROWSER_PORT: String(TEST_LOCAL_AGENT_HTTP_PORT),
          DEV_BROWSER_CDP_PORT: String(TEST_LOCAL_AGENT_CDP_PORT),
          DEV_BROWSER_PROFILE: TEST_LOCAL_AGENT_CHROME_PROFILE,
        },
        timeout: 30000,
      },
      'complete-task': {
        type: 'local',
        command: ['npx', 'tsx', path.join(mcpToolsPath, 'complete-task', 'src', 'index.ts')],
        enabled: true,
        timeout: 5000,
      },
    },
  };

  const configJson = JSON.stringify(config, null, 2);
  fs.writeFileSync(configPath, configJson);

  return configPath;
}

export { TEST_LOCAL_AGENT_CDP_PORT, TEST_LOCAL_AGENT_CHROME_PROFILE, TEST_LOCAL_AGENT_HTTP_PORT };

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  generateTestLocalAgentConfig();
}
