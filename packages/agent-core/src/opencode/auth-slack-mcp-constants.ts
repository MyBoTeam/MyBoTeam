export const OPENCODE_SLACK_MCP_SERVER_URL = 'https://mcp.slack.com/mcp';
export const OPENCODE_SLACK_MCP_CLIENT_ID = '1601185624273.8899143856786';
export const OPENCODE_SLACK_MCP_CALLBACK_HOST = 'localhost';
export const OPENCODE_SLACK_MCP_CALLBACK_PORT = 3118;
export const OPENCODE_SLACK_MCP_CALLBACK_PATH = '/callback';

export function getSlackMcpCallbackUrl(): string {
  return `http://${OPENCODE_SLACK_MCP_CALLBACK_HOST}:${OPENCODE_SLACK_MCP_CALLBACK_PORT}${OPENCODE_SLACK_MCP_CALLBACK_PATH}`;
}
