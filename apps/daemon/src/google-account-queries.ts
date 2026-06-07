import type { GoogleAccountStatus } from '@myboteam/agent-core';
import type { Database } from '@myboteam/agent-core/storage/database';
import { rowFromResult } from '@myboteam/agent-core/storage/query-helpers';
import { GWS_ACCOUNT_STATUS_CHANGED } from './google-account-constants.js';

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
