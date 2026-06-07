import {
  type CopilotDeviceCodeResponse,
  clearCopilotOAuth,
  getCopilotOAuthStatus,
  pollCopilotDeviceToken,
  requestCopilotDeviceCode,
  setCopilotOAuthTokens,
} from '@myboteam/agent-core/desktop-main';
import { shell } from 'electron';
import { getLogCollector } from '../logging';

export interface CopilotLoginResult {
  ok: boolean;
  userCode?: string;
  verificationUri?: string;
  expiresIn?: number;
}

let activeLoginAbortController: AbortController | null = null;

export async function loginGithubCopilot(): Promise<CopilotLoginResult> {
  if (activeLoginAbortController) {
    activeLoginAbortController.abort();
    activeLoginAbortController = null;
  }

  const abortController = new AbortController();
  activeLoginAbortController = abortController;

  const log = getLogCollector();

  try {
    log.log?.('INFO', 'opencode', '[CopilotAuth] Starting device code flow');

    const deviceCode: CopilotDeviceCodeResponse = await requestCopilotDeviceCode();

    log.log?.('INFO', 'opencode', '[CopilotAuth] Device code received');

    try {
      await shell.openExternal(deviceCode.verification_uri);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.log?.('WARN', 'opencode', `[CopilotAuth] Failed to open browser: ${msg}`);
    }

    void (async () => {
      try {
        const tokenResponse = await pollCopilotDeviceToken({
          deviceCode: deviceCode.device_code,
          interval: deviceCode.interval,
          expiresIn: deviceCode.expires_in,
          onPoll: () => {
            if (abortController.signal.aborted) {
              throw new Error('Login cancelled');
            }
            log.log?.('INFO', 'opencode', '[CopilotAuth] Polling for token...');
          },
        });

        if (!tokenResponse.access_token) {
          throw new Error('No access token received from GitHub');
        }

        setCopilotOAuthTokens({
          accessToken: tokenResponse.access_token,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        });

        log.log?.('INFO', 'opencode', '[CopilotAuth] Login successful, tokens saved');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.log?.('WARN', 'opencode', `[CopilotAuth] Background poll failed: ${msg}`);

        try {
          clearCopilotOAuth();

          const fs = await import('node:fs');
          const os = await import('node:os');
          const path = await import('node:path');
          const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
          const authPath = path.join(dataHome, 'opencode', 'auth.json');
          let auth: Record<string, unknown> = {};
          try {
            auth = JSON.parse(fs.readFileSync(authPath, 'utf8')) as Record<string, unknown>;
          } catch {}
          auth['github-copilot-error'] = { message: msg, timestamp: Date.now() };
          fs.mkdirSync(path.dirname(authPath), { recursive: true });
          fs.writeFileSync(authPath, JSON.stringify(auth, null, 2), 'utf8');
        } catch {}
      } finally {
        if (activeLoginAbortController === abortController) {
          activeLoginAbortController = null;
        }
      }
    })();

    return {
      ok: true,
      userCode: deviceCode.user_code,
      verificationUri: deviceCode.verification_uri,
      expiresIn: deviceCode.expires_in,
    };
  } catch (err) {
    if (activeLoginAbortController === abortController) {
      activeLoginAbortController = null;
    }
    const msg = err instanceof Error ? err.message : String(err);
    log.log?.('WARN', 'opencode', `[CopilotAuth] Login failed: ${msg}`);
    throw err;
  }
}

export function logoutGithubCopilot(): void {
  clearCopilotOAuth();
}

export { getCopilotOAuthStatus };
