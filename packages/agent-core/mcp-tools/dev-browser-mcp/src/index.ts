#!/usr/bin/env node

console.error('[dev-browser-mcp] Script starting...');
console.error('[dev-browser-mcp] Node version:', process.version);
console.error('[dev-browser-mcp] CWD:', process.cwd());
console.error('[dev-browser-mcp] MYBOTEAM_TASK_ID:', process.env.MYBOTEAM_TASK_ID || '(not set)');

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { configureFromEnv } from './connection.js';
import { server } from './server.js';
import { ensureConnected, loadToolDebug } from './session-manager.js';

console.error('[dev-browser-mcp] All imports completed successfully');

const connectionConfig = configureFromEnv();
const _TASK_ID = connectionConfig.taskId;

await loadToolDebug();

async function main() {
  console.error('[dev-browser-mcp] main() called, creating transport...');
  const transport = new StdioServerTransport();
  console.error('[dev-browser-mcp] Transport created, connecting server...');
  await server.connect(transport);
  console.error('[dev-browser-mcp] Server connected successfully!');
  console.error('[dev-browser-mcp] MCP Server ready and listening for tool calls');

  console.error('[dev-browser-mcp] Connecting to browser for auto-glow setup...');
  try {
    await ensureConnected();
    console.error('[dev-browser-mcp] Browser connected, page listeners active');
  } catch (err) {
    console.error(
      '[dev-browser-mcp] Could not connect to browser yet (will retry on first tool call):',
      err,
    );
  }
}

console.error('[dev-browser-mcp] Calling main()...');
main().catch((error) => {
  console.error('[dev-browser-mcp] Failed to start server:', error);
  process.exit(1);
});
