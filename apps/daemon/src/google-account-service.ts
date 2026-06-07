import { EventEmitter } from 'node:events';
import type {
  GoogleAccount,
  GoogleAccountToken,
  GwsAccountAddInput,
  GwsAccountTokenResult,
  StorageAPI,
} from '@myboteam/agent-core';
import type { Database } from '@myboteam/agent-core/storage/database';
import { flushDatabase } from '@myboteam/agent-core/storage/database';
import { rowsFromResult } from '@myboteam/agent-core/storage/query-helpers';
import {
  cancelRefreshTimer,
  refreshToken as doRefreshToken,
  emitAccountStatus,
  type GoogleAccountRow,
  isAccountDuplicate,
  isLabelDuplicate,
  scheduleRefreshTimer,
  tokenKey,
} from './google-account-types.js';

export { GWS_ACCOUNT_STATUS_CHANGED } from './google-account-types.js';

export class GoogleAccountService extends EventEmitter {
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly googleClientId: string;

  constructor(
    private readonly db: Database,
    private readonly storage: StorageAPI,
  ) {
    super();
    this.googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
  }

  startAllTimers(): void {
    for (const account of this.list()) {
      if (account.status !== 'connected') {
        continue;
      }
      const raw = this.storage.get(tokenKey(account.googleAccountId));
      if (!raw) {
        continue;
      }
      try {
        const token = JSON.parse(raw) as GoogleAccountToken;
        scheduleRefreshTimer(
          account.googleAccountId,
          token.expiresAt,
          this.timers,
          () => void this.refreshToken(account.googleAccountId),
        );
      } catch {
        // Malformed stored token — skip
      }
    }
  }

  stopAllTimers(): void {
    for (const [, timer] of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  list(): GoogleAccount[] {
    const rows = rowsFromResult<GoogleAccountRow>(
      this.db.exec('SELECT * FROM google_accounts ORDER BY connected_at ASC'),
    );
    return rows.map((row) => ({
      googleAccountId: row.google_account_id,
      email: row.email,
      displayName: row.display_name,
      pictureUrl: row.picture_url,
      label: row.label,
      status: row.status,
      connectedAt: row.connected_at,
      lastRefreshedAt: row.last_refreshed_at,
    }));
  }

  add(input: GwsAccountAddInput): void {
    if (isAccountDuplicate(this.db, input.googleAccountId)) {
      throw new Error('Account already connected');
    }
    if (isLabelDuplicate(this.db, input.label)) {
      throw new Error('Label already in use');
    }

    this.db.run(
      `INSERT INTO google_accounts
        (google_account_id, email, display_name, picture_url, label, status, connected_at, last_refreshed_at)
       VALUES (?, ?, ?, ?, ?, 'connected', ?, NULL)`,
      [
        input.googleAccountId,
        input.email,
        input.displayName,
        input.pictureUrl,
        input.label,
        input.connectedAt,
      ],
    );
    flushDatabase();

    try {
      this.storage.set(tokenKey(input.googleAccountId), JSON.stringify(input.token));
    } catch (err) {
      this.db.run('DELETE FROM google_accounts WHERE google_account_id = ?', [
        input.googleAccountId,
      ]);
      flushDatabase();
      throw err;
    }

    scheduleRefreshTimer(
      input.googleAccountId,
      input.token.expiresAt,
      this.timers,
      () => void this.refreshToken(input.googleAccountId),
    );
  }

  remove(googleAccountId: string): void {
    const previous = this.storage.get(tokenKey(googleAccountId)) ?? '';
    this.storage.set(tokenKey(googleAccountId), '');
    try {
      this.db.run('DELETE FROM google_accounts WHERE google_account_id = ?', [googleAccountId]);
      flushDatabase();
    } catch (err) {
      this.storage.set(tokenKey(googleAccountId), previous);
      throw err;
    }
    cancelRefreshTimer(googleAccountId, this.timers);
  }

  updateToken(googleAccountId: string, token: GoogleAccountToken, connectedAt: string): void {
    this.storage.set(tokenKey(googleAccountId), JSON.stringify(token));
    this.db.run(
      "UPDATE google_accounts SET status = 'connected', connected_at = ? WHERE google_account_id = ?",
      [connectedAt, googleAccountId],
    );
    flushDatabase();
    scheduleRefreshTimer(
      googleAccountId,
      token.expiresAt,
      this.timers,
      () => void this.refreshToken(googleAccountId),
    );
    emitAccountStatus(this, googleAccountId, 'connected');
  }

  updateLabel(googleAccountId: string, label: string): void {
    if (isLabelDuplicate(this.db, label, googleAccountId)) {
      throw new Error('Label already in use');
    }
    this.db.run('UPDATE google_accounts SET label = ? WHERE google_account_id = ?', [
      label,
      googleAccountId,
    ]);
    flushDatabase();
  }

  getToken(googleAccountId: string): GwsAccountTokenResult | null {
    const raw = this.storage.get(tokenKey(googleAccountId));
    if (!raw || raw === '') {
      return null;
    }
    try {
      const token = JSON.parse(raw) as GoogleAccountToken;
      return {
        accessToken: token.accessToken,
        scopes: token.scopes,
        expiresAt: token.expiresAt,
      };
    } catch {
      return null;
    }
  }

  async refreshNow(accountId: string): Promise<void> {
    await this.refreshToken(accountId);
  }

  private refreshToken(accountId: string): Promise<void> {
    return doRefreshToken(
      accountId,
      this.storage,
      this.db,
      this.googleClientId,
      this.timers,
      (id, status) => {
        emitAccountStatus(this, id, status);
      },
    );
  }
}
