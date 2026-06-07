import type { GoogleAccount } from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import { BrowserWindow } from 'electron';
import { getDaemonClient } from '../../daemon-bootstrap';
import type { cancelGoogleOAuth, startGoogleOAuth } from '../../google-accounts/google-auth.js';
import { getLogCollector } from '../../logging';
import { handle } from './utils.js';

function broadcastAuthError(message: string): void {
  try {
    getLogCollector()?.log('WARN', 'main', '[GoogleAccounts] OAuth error surfaced to renderer', {
      message,
    });
  } catch {}
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed() || win.webContents.isDestroyed()) {
      continue;
    }
    try {
      win.webContents.send('gws:account:auth-error', { message });
    } catch {}
  }
}

type GoogleAuthFn = typeof startGoogleOAuth;
type CancelGoogleOAuthFn = typeof cancelGoogleOAuth;

export function registerGoogleAccountHandlers(
  googleAuth: GoogleAuthFn,
  cancelGoogleOAuthFn: CancelGoogleOAuthFn,
): void {
  handle('gws:accounts:list', async (): Promise<GoogleAccount[]> => {
    return getDaemonClient().call('gwsAccount.list');
  });

  handle(
    'gws:accounts:start-auth',
    async (
      _event: IpcMainInvokeEvent,
      label: string,
    ): Promise<{ state: string; authUrl: string }> => {
      const { state, authUrl, waitForCallback } = await googleAuth(label);

      waitForCallback()
        .then(async (result) => {
          const now = new Date().toISOString();
          const client = getDaemonClient();
          try {
            await client.call('gwsAccount.add', {
              input: {
                googleAccountId: result.googleAccountId,
                email: result.email,
                displayName: result.displayName,
                pictureUrl: result.pictureUrl,
                label,
                connectedAt: now,
                token: result.token,
              },
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('Account already connected')) {
              try {
                await client.call('gwsAccount.updateToken', {
                  googleAccountId: result.googleAccountId,
                  token: result.token,
                  connectedAt: now,
                });
              } catch (updateErr) {
                const updateMsg =
                  updateErr instanceof Error ? updateErr.message : String(updateErr);
                broadcastAuthError(`Failed to update Google account token: ${updateMsg}`);
              }
              return;
            }
            broadcastAuthError(`Google account connection failed: ${msg}`);
          }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === 'Google OAuth timed out') {
            return;
          }
          broadcastAuthError(msg);
        });

      return { state, authUrl };
    },
  );

  handle(
    'gws:accounts:complete-auth',
    async (_event: IpcMainInvokeEvent, _state: string, _code: string): Promise<GoogleAccount> => {
      throw new Error(
        'This flow is handled automatically by the start-auth callback. No action needed.',
      );
    },
  );

  handle('gws:accounts:remove', async (_event: IpcMainInvokeEvent, id: string): Promise<void> => {
    await getDaemonClient().call('gwsAccount.remove', { googleAccountId: id });
  });

  handle(
    'gws:accounts:update-label',
    async (_event: IpcMainInvokeEvent, id: string, label: string): Promise<void> => {
      await getDaemonClient().call('gwsAccount.updateLabel', {
        googleAccountId: id,
        label,
      });
    },
  );

  handle(
    'gws:accounts:cancel-auth',
    async (_event: IpcMainInvokeEvent, state: string): Promise<void> => {
      cancelGoogleOAuthFn(state);
    },
  );
}
