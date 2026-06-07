import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createConsoleLogger } from '../utils/logging.js';

export type { CopilotDeviceCodeResponse, CopilotTokenResponse } from './copilot-auth.js';
export {
  GITHUB_COPILOT_API_URL,
  GITHUB_COPILOT_AUTH_URL,
  GITHUB_COPILOT_DEVICE_CODE_URL,
  GITHUB_COPILOT_OAUTH_CLIENT_ID,
  GITHUB_COPILOT_SCOPE,
  GITHUB_COPILOT_TOKEN_URL,
  pollCopilotDeviceToken,
  requestCopilotDeviceCode,
} from './copilot-auth.js';

const log = createConsoleLogger({ prefix: 'CopilotProvider' });

export interface CopilotOAuthStatus {
  connected: boolean;
  username?: string;
  expiresAt?: number;
}

export interface CopilotAuthEntry {
  type: 'copilot-oauth';
  access?: string;
  refresh?: string;
  expires?: number;
  username?: string;
}

function getOpenCodeAuthJsonPath(): string {
  const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(dataHome, 'opencode', 'auth.json');
}

function readAuthJson(): Record<string, unknown> {
  const authPath = getOpenCodeAuthJsonPath();
  try {
    if (!fs.existsSync(authPath)) {
      return {};
    }
    const raw = fs.readFileSync(authPath, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeAuthJson(data: Record<string, unknown>): void {
  const authPath = getOpenCodeAuthJsonPath();
  fs.mkdirSync(path.dirname(authPath), { recursive: true });
  fs.writeFileSync(authPath, JSON.stringify(data, null, 2), 'utf8');
  log.info('[CopilotProvider] auth.json updated');
}

export function getCopilotOAuthStatus(): CopilotOAuthStatus {
  const auth = readAuthJson();
  const entry = auth['github-copilot'];
  if (!entry || typeof entry !== 'object') {
    return { connected: false };
  }

  const e = entry as CopilotAuthEntry;
  if (e.type !== 'copilot-oauth') {
    return { connected: false };
  }

  const connected =
    (typeof e.access === 'string' && e.access.trim().length > 0) ||
    (typeof e.refresh === 'string' && e.refresh.trim().length > 0);

  return {
    connected,
    username: e.username,
    expiresAt: e.expires,
  };
}

export function setCopilotOAuthTokens(params: {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  username?: string;
}): void {
  const auth = readAuthJson();
  auth['github-copilot'] = {
    type: 'copilot-oauth',
    access: params.accessToken,
    ...(params.refreshToken ? { refresh: params.refreshToken } : {}),
    ...(params.expiresAt ? { expires: params.expiresAt } : {}),
    ...(params.username ? { username: params.username } : {}),
  } satisfies CopilotAuthEntry;
  writeAuthJson(auth);
}

export function clearCopilotOAuth(): void {
  const auth = readAuthJson();
  delete auth['github-copilot'];
  writeAuthJson(auth);
  log.info('[CopilotProvider] Copilot credentials cleared');
}
