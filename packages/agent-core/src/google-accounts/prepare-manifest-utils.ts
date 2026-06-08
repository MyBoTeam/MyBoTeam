import type { GoogleAccountToken } from '../common/types/google-account.js';
import type { Database } from '../storage/database.js';
import { flushDatabase } from '../storage/database.js';
import type { StorageAPI } from '../types/storage.js';
import { GOOGLE_TOKEN_ENDPOINT, gwsTokenKey, TOKEN_REFRESH_MARGIN_MS } from './constants.js';

export type LogFn = (
  level: 'INFO' | 'WARN' | 'ERROR',
  message: string,
  data?: Record<string, unknown>,
) => void;

export async function readOrRefreshToken(
  storage: StorageAPI,
  db: Database,
  accountId: string,
  log: LogFn,
): Promise<GoogleAccountToken | null> {
  const raw = storage.get(gwsTokenKey(accountId));
  if (!raw || raw === '') {
    return null;
  }

  let token: GoogleAccountToken;
  try {
    token = JSON.parse(raw) as GoogleAccountToken;
  } catch (err) {
    log('WARN', '[prepareGwsManifest] failed to parse stored token', {
      accountId,
      err: String(err),
    });
    return null;
  }

  const needsRefresh = token.expiresAt - Date.now() < TOKEN_REFRESH_MARGIN_MS;
  if (!needsRefresh) {
    return token;
  }

  if (!token.refreshToken) {
    log('WARN', '[prepareGwsManifest] token near expiry but no refresh token', { accountId });
    return token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  if (!clientId) {
    log('WARN', '[prepareGwsManifest] GOOGLE_CLIENT_ID unset; skipping inline refresh', {
      accountId,
    });
    return token;
  }

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';

  try {
    const params: Record<string, string> = {
      client_id: clientId,
      refresh_token: token.refreshToken,
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

    if (!res.ok) {
      log('WARN', '[prepareGwsManifest] inline refresh non-OK response', {
        accountId,
        status: res.status,
      });
      return token;
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!data.access_token || data.error) {
      log('WARN', '[prepareGwsManifest] inline refresh returned no access_token', {
        accountId,
        error: data.error,
      });
      return token;
    }

    const newExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    const refreshed: GoogleAccountToken = {
      accessToken: data.access_token,
      refreshToken: token.refreshToken,
      expiresAt: newExpiresAt,
      scopes: token.scopes,
    };

    const currentRaw = storage.get(gwsTokenKey(accountId));
    if (!currentRaw || currentRaw !== raw) {
      log('INFO', '[prepareGwsManifest] stored token changed during inline refresh; not writing', {
        accountId,
      });
      try {
        return currentRaw ? (JSON.parse(currentRaw) as GoogleAccountToken) : refreshed;
      } catch {
        return refreshed;
      }
    }

    storage.set(gwsTokenKey(accountId), JSON.stringify(refreshed));
    try {
      db.run('UPDATE google_accounts SET last_refreshed_at = ? WHERE google_account_id = ?', [
        new Date().toISOString(),
        accountId,
      ]);
      flushDatabase();
    } catch (err) {
      log('WARN', '[prepareGwsManifest] last_refreshed_at UPDATE failed', {
        accountId,
        err: String(err),
      });
    }

    return refreshed;
  } catch (err) {
    log('WARN', '[prepareGwsManifest] inline refresh network error', {
      accountId,
      err: String(err),
    });
    return token;
  }
}
