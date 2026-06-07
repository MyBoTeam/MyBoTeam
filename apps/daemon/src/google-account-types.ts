import type { GoogleAccountStatus, GoogleAccountToken, StorageAPI } from '@myboteam/agent-core';
import type { Database } from '@myboteam/agent-core/storage/database';
import { flushDatabase } from '@myboteam/agent-core/storage/database';
import { rowFromResult } from '@myboteam/agent-core/storage/query-helpers';

export const TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000;
export const TRANSIENT_RETRY_DELAY_MS = 60 * 1000;
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export const GWS_ACCOUNT_STATUS_CHANGED = 'gwsAccount.statusChanged' as const;

export const tokenKey = (accountId: string): string => `gws:token:${accountId}`;

export interface GoogleAccountRow {
  google_account_id: string;
  email: string;
  display_name: string;
  picture_url: string | null;
  label: string;
  status: GoogleAccountStatus;
  connected_at: string;
  last_refreshed_at: string | null;
}

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

export function emitAccountStatus(
  emitter: { emit(event: string, ...args: unknown[]): boolean },
  googleAccountId: string,
  status: GoogleAccountStatus,
): void {
  emitter.emit(GWS_ACCOUNT_STATUS_CHANGED, {
    googleAccountId,
    status,
  });
}

export function isAccountDuplicate(db: Database, googleAccountId: string): boolean {
  const row = rowFromResult<{ '1': number }>(
    db.exec('SELECT 1 FROM google_accounts WHERE google_account_id = ?', [googleAccountId]),
  );
  return row !== undefined;
}

export function isLabelDuplicate(
  db: Database,
  label: string,
  excludeGoogleAccountId?: string,
): boolean {
  if (excludeGoogleAccountId) {
    const row = rowFromResult<{ '1': number }>(
      db.exec(
        'SELECT 1 FROM google_accounts WHERE LOWER(label) = LOWER(?) AND google_account_id != ?',
        [label, excludeGoogleAccountId],
      ),
    );
    return row !== undefined;
  }
  const row = rowFromResult<{ '1': number }>(
    db.exec('SELECT 1 FROM google_accounts WHERE LOWER(label) = LOWER(?)', [label]),
  );
  return row !== undefined;
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

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';

  try {
    const params: Record<string, string> = {
      client_id: googleClientId,
      refresh_token: parsed.refreshToken,
      grant_type: 'refresh_token',
    };
    if (clientSecret) {
      params.client_secret = clientSecret;
    }
    const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
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
