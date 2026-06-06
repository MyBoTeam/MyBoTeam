// =============================================================================
// @myboteam/agent-core/desktop-main-ipc
// =============================================================================
// IPC-related re-exports for the Electron main process. Split from
// desktop-main.ts to keep each file under the 200-line limit.
// =============================================================================

// MCP OAuth helpers (pure HTTP fetch + PKCE)
export {
  buildAuthorizationUrl,
  discoverOAuthMetadata,
  discoverOAuthProtectedResourceMetadata,
  exchangeCodeForTokens,
  generatePkceChallenge,
  isTokenExpired,
  refreshAccessToken,
  registerOAuthClient,
} from './connectors/mcp-oauth.js';

// Daemon RPC infrastructure (client + transport + socket paths + PID lock)
export type { DaemonClientOptions } from './daemon/client.js';
export { DaemonClient } from './daemon/client.js';
export { installCrashHandlers } from './daemon/crash-handlers.js';
export type { PidLockHandle, PidLockPayload } from './daemon/pid-lock.js';
export { acquirePidLock, PidLockError } from './daemon/pid-lock.js';
export { getDaemonDir, getPidFilePath, getSocketPath } from './daemon/socket-path.js';
export type { SocketTransportOptions } from './daemon/socket-transport.js';
export { createSocketTransport } from './daemon/socket-transport.js';

// OpenCode auth (reads auth.json from disk — file I/O, no DB)
export {
  clearSlackMcpAuth,
  getSlackMcpCallbackUrl,
  getSlackMcpOauthStatus,
  OPENCODE_SLACK_MCP_CALLBACK_HOST,
  OPENCODE_SLACK_MCP_CALLBACK_PATH,
  OPENCODE_SLACK_MCP_CALLBACK_PORT,
  OPENCODE_SLACK_MCP_CLIENT_ID,
  OPENCODE_SLACK_MCP_SERVER_URL,
  setSlackMcpPendingAuth,
  setSlackMcpTokens,
} from './opencode/auth.js';

// OpenCode CLI resolution (filesystem only)
export { isCliAvailable, resolveCliPath } from './opencode/cli-resolver.js';
