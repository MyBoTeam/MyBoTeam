import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GoogleAccount } from '../common/types/google-account.js';
import { atomicWriteFile } from '../internal/classes/secure-storage-crypto.js';
import type { Database } from '../storage/database.js';
import { rowsFromResult } from '../storage/query-helpers.js';
import type { StorageAPI } from '../types/storage.js';
import type { LogFn } from './prepare-manifest-utils.js';
import { readOrRefreshToken } from './prepare-manifest-utils.js';

export interface GwsAccountEntry {
  googleAccountId: string;
  label: string;
  email: string;
  tokenFilePath: string;
}

export interface GwsAccountSummary {
  label: string;
  email: string;
  status: GoogleAccount['status'];
}

export interface PrepareGwsManifestResult {
  manifestPath: string;
  summary: GwsAccountSummary[];
}

export async function prepareGwsManifest(
  storage: StorageAPI,
  db: Database,
  userDataPath: string,
  log: LogFn,
): Promise<PrepareGwsManifestResult | undefined> {
  let rows: Record<string, unknown>[];
  try {
    rows = rowsFromResult(
      db.exec(`SELECT * FROM google_accounts WHERE status = 'connected' ORDER BY connected_at ASC`),
    );
  } catch (err) {
    log('WARN', '[prepareGwsManifest] google_accounts read failed; skipping GWS step', {
      err: String(err),
    });
    return undefined;
  }

  if (rows.length === 0) {
    return undefined;
  }

  const accounts: GoogleAccount[] = rows.map((r) => ({
    googleAccountId: r.google_account_id as string,
    email: r.email as string,
    displayName: r.display_name as string,
    pictureUrl: r.picture_url as string | null,
    label: r.label as string,
    status: r.status as GoogleAccount['status'],
    connectedAt: r.connected_at as string,
    lastRefreshedAt: r.last_refreshed_at as string | null,
  }));

  const tokenDir = path.join(userDataPath, 'gws-tokens');
  fs.mkdirSync(tokenDir, { recursive: true });
  try {
    fs.chmodSync(tokenDir, 0o700);
  } catch {
    // non-critical
  }

  const entries: GwsAccountEntry[] = [];
  const summary: GwsAccountSummary[] = [];

  for (const account of accounts) {
    const token = await readOrRefreshToken(storage, db, account.googleAccountId, log);
    if (!token) {
      summary.push({ label: account.label, email: account.email, status: account.status });
      continue;
    }

    const tokenFilePath = path.join(tokenDir, `${account.googleAccountId}.json`);
    try {
      atomicWriteFile(tokenFilePath, JSON.stringify(token));
      try {
        fs.chmodSync(tokenFilePath, 0o600);
      } catch {
        // non-critical
      }
    } catch (err) {
      log('WARN', '[prepareGwsManifest] failed to write per-account token file', {
        googleAccountId: account.googleAccountId,
        err: String(err),
      });
      summary.push({ label: account.label, email: account.email, status: account.status });
      continue;
    }

    entries.push({
      googleAccountId: account.googleAccountId,
      label: account.label,
      email: account.email,
      tokenFilePath,
    });
    summary.push({ label: account.label, email: account.email, status: account.status });
  }

  if (entries.length === 0) {
    return { manifestPath: '', summary };
  }

  const manifestDir = path.join(userDataPath, 'gws-manifests');
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifestPath = path.join(manifestDir, 'manifest.json');
  try {
    atomicWriteFile(manifestPath, JSON.stringify(entries, null, 2));
    try {
      fs.chmodSync(manifestPath, 0o600);
    } catch {
      // non-critical
    }
  } catch (err) {
    log('ERROR', '[prepareGwsManifest] failed to write manifest', { err: String(err) });
    return { manifestPath: '', summary };
  }

  return { manifestPath, summary };
}
