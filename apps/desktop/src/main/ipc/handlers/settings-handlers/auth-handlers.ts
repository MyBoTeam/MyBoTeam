import { getSlackMcpOauthStatus, validateHttpUrl } from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { shell } from 'electron';
import { ensureDaemonRunning } from '../../../daemon/daemon-connector';
import { getDaemonClient } from '../../../daemon-bootstrap';
import {
  getCopilotOAuthStatus,
  loginGithubCopilot,
  logoutGithubCopilot,
} from '../../../opencode/copilot-auth';
import { loginSlackMcp, logoutSlackMcp } from '../../../opencode/slack-auth';
import type { IpcHandler } from '../../types';

export function registerAuthHandlers(handle: IpcHandler): void {
  handle('settings:openai-base-url:get', async (_event: IpcMainInvokeEvent) => {
    return getDaemonClient().call('settings.getOpenAiBaseUrl');
  });

  handle('settings:openai-base-url:set', async (_event: IpcMainInvokeEvent, baseUrl: string) => {
    if (typeof baseUrl !== 'string') {
      throw new Error('Invalid base URL');
    }

    const trimmed = baseUrl.trim();
    if (!trimmed) {
      await getDaemonClient().call('settings.setOpenAiBaseUrl', { baseUrl: '' });
      return;
    }

    validateHttpUrl(trimmed, 'OpenAI base URL');
    await getDaemonClient().call('settings.setOpenAiBaseUrl', {
      baseUrl: trimmed.replace(/\/+$/, ''),
    });
  });

  handle('opencode:auth:openai:status', async (_event: IpcMainInvokeEvent) => {
    const client = await ensureDaemonRunning();
    return (await client.call('auth.openai.status')) as { connected: boolean; expires?: number };
  });

  handle('opencode:auth:openai:login', async (_event: IpcMainInvokeEvent) => {
    const client = await ensureDaemonRunning();
    const { sessionId, authorizeUrl } = (await client.call('auth.openai.startLogin')) as {
      sessionId: string;
      authorizeUrl: string;
    };

    await shell.openExternal(authorizeUrl);

    const AWAIT_COMPLETION_RPC_TIMEOUT_MS = 2 * 60_000 + 5_000;
    const completion = (await client.call(
      'auth.openai.awaitCompletion',
      {
        sessionId,
        timeoutMs: 2 * 60_000,
      },
      { timeoutMs: AWAIT_COMPLETION_RPC_TIMEOUT_MS },
    )) as { ok: boolean; plan?: unknown; error?: string };
    if (!completion.ok) {
      throw new Error(completion.error ?? 'OpenAI authentication failed.');
    }

    return { ok: true, openedUrl: authorizeUrl };
  });

  handle('opencode:auth:slack:status', async (_event: IpcMainInvokeEvent) => {
    return getSlackMcpOauthStatus();
  });

  handle('opencode:auth:slack:login', async (_event: IpcMainInvokeEvent) => {
    await loginSlackMcp();
    return { ok: true };
  });

  handle('opencode:auth:slack:logout', async (_event: IpcMainInvokeEvent) => {
    await logoutSlackMcp();
  });

  handle('opencode:auth:copilot:status', async (_event: IpcMainInvokeEvent) => {
    return getCopilotOAuthStatus();
  });

  handle('opencode:auth:copilot:login', async (_event: IpcMainInvokeEvent) => {
    try {
      const result = await loginGithubCopilot();
      return result;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(String(err));
    }
  });

  handle('opencode:auth:copilot:logout', async (_event: IpcMainInvokeEvent) => {
    logoutGithubCopilot();
  });
}
