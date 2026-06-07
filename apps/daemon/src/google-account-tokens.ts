import type { GoogleAccountStatus, GoogleAccountToken, StorageAPI } from '@myboteam/agent-core';
import type { Database } from '@myboteam/agent-core/storage/database';
import { flushDatabase } from '@myboteam/agent-core/storage/database';
import {
  GOOGLE_TOKEN_ENDPOINT,
  TOKEN_REFRESH_MARGIN_MS,
  TRANSIENT_RETRY_DELAY_MS,
  tokenKey,
} from './google-account-constants.js';

export function scheduleRefreshTimer(
  accountId: string,
  expiresAt: number,
  timers: Map<string, NodeJS.Timeout>,
  refreshCallback: () => void,
): void {
  cancelRefreshTimer(accountId, timers);
  const delay = Math.max(expiresAt - Date.now() - TOKEN_REFRESH_MARGIN_MS, 0);
  const timer = setTimeout(refreshCallback, delay);
  timers.set(accountId, timer);
}

export function cancelRefreshTimer(accountId: string, timers: Map<string, NodeJS.Timeout>): void {
  const timer = timers.get(accountId);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(accountId);
  }
}

export function persistToken(
  storage: StorageAPI,
  db: Database,
  accountId: string,
  newToken: GoogleAccountToken,
  oldRaw: string,
): boolean {
  const currentRaw = storage.get(tokenKey(accountId));
  if (!currentRaw || currentRaw !== oldRaw) {
    return false;
  }
  storage.set(tokenKey(accountId), JSON.stringify(newToken));
  db.run('UPDATE google_accounts SET last_refreshed_at = ? WHERE google_account_id = ?', [
    new Date().toISOString(),
    accountId,
  ]);
  return true;
}

export async function refreshToken(
  accountId: string,
  storage: StorageAPI,
  db: Database,
  googleClientId: string,
  timers: Map<string, NodeJS.Timeout>,
  emitStatus: (accountId: string, status: GoogleAccountStatus) => void,
): Promise<void> {
  const raw = storage.get(tokenKey(accountId));
  if (!raw) {
    return;
  }

  let parsed: { refreshToken: string; expiresAt: number; scopes: string[] };
  try {
    parsed = JSON.parse(raw) as { refreshToken: string; expiresAt: number; scopes: string[] };
  } catch {
    return;
  }

  try {
    const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        refresh_token: parsed.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (res.status === 401 || res.status === 403) {
      handlePermanentFailure(accountId, db, timers, emitStatus);
      return;
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!res.ok || data.error === 'invalid_grant' || !data.access_token) {
      if (data.error === 'invalid_grant') {
        handlePermanentFailure(accountId, db, timers, emitStatus);
        return;
      }
      const timer = setTimeout(() => {
        void refreshToken(accountId, storage, db, googleClientId, timers, emitStatus);
      }, TRANSIENT_RETRY_DELAY_MS);
      timers.set(accountId, timer);
      return;
    }

    const newExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    const newToken: GoogleAccountToken = {
      accessToken: data.access_token,
      refreshToken: parsed.refreshToken,
      expiresAt: newExpiresAt,
      scopes: parsed.scopes,
    };

    if (!persistToken(storage, db, accountId, newToken, raw)) {
      return;
    }
    flushDatabase();

    scheduleRefreshTimer(accountId, newExpiresAt, timers, () => {
      void refreshToken(accountId, storage, db, googleClientId, timers, emitStatus);
    });
  } catch {
    const timer = setTimeout(() => {
      void refreshToken(accountId, storage, db, googleClientId, timers, emitStatus);
    }, TRANSIENT_RETRY_DELAY_MS);
    timers.set(accountId, timer);
  }
}

function handlePermanentFailure(
  accountId: string,
  db: Database,
  timers: Map<string, NodeJS.Timeout>,
  emitStatus: (accountId: string, status: GoogleAccountStatus) => void,
): void {
  cancelRefreshTimer(accountId, timers);
  db.run("UPDATE google_accounts SET status = 'expired' WHERE google_account_id = ?", [accountId]);
  flushDatabase();
  emitStatus(accountId, 'expired');
}
