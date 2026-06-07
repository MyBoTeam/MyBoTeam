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

export type { DaemonClientOptions } from './daemon/client.js';
export { DaemonClient } from './daemon/client.js';
export { installCrashHandlers } from './daemon/crash-handlers.js';
export type { PidLockHandle, PidLockPayload } from './daemon/pid-lock.js';
export { acquirePidLock, PidLockError } from './daemon/pid-lock.js';
export { getDaemonDir, getPidFilePath, getSocketPath } from './daemon/socket-path.js';
export type { SocketTransportOptions } from './daemon/socket-transport.js';
export { createSocketTransport } from './daemon/socket-transport.js';

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

export { isCliAvailable, resolveCliPath } from './opencode/cli-resolver.js';
