import type {
  ConnectedProvider,
  ProviderId,
  ProviderSettings,
} from '../../common/types/providerSettings.js';
import { flushDatabase, getDatabase, withTransaction } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';
import type { ProviderMetaRow, ProviderRow } from './provider-settings-types.js';
import { rowToProvider } from './provider-settings-types.js';

export function getMetaRow(): ProviderMetaRow {
  const db = getDatabase();
  return rowFromResult<ProviderMetaRow>(
    db.exec('SELECT * FROM provider_meta WHERE id = 1'),
  ) as ProviderMetaRow;
}

export function getProviderSettings(): ProviderSettings {
  const db = getDatabase();
  const meta = getMetaRow();

  const rows = rowsFromResult<ProviderRow>(db.exec('SELECT * FROM providers'));
  const connectedProviders: Partial<Record<ProviderId, ConnectedProvider>> = {};

  for (const row of rows) {
    connectedProviders[row.provider_id as ProviderId] = rowToProvider(row);
  }

  return {
    activeProviderId: meta.active_provider_id as ProviderId | null,
    connectedProviders,
    debugMode: meta.debug_mode === 1,
  };
}

export function setActiveProvider(providerId: ProviderId | null): void {
  const db = getDatabase();
  db.run('UPDATE provider_meta SET active_provider_id = ? WHERE id = 1', [providerId]);
  flushDatabase();
}

export function getActiveProviderId(): ProviderId | null {
  return getMetaRow().active_provider_id as ProviderId | null;
}

export function setProviderDebugMode(enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE provider_meta SET debug_mode = ? WHERE id = 1', [enabled ? 1 : 0]);
  flushDatabase();
}

export function getProviderDebugMode(): boolean {
  return getMetaRow().debug_mode === 1;
}

export function clearProviderSettings(): void {
  const db = getDatabase();
  withTransaction(db, () => {
    db.run('DELETE FROM providers');
    db.run('UPDATE provider_meta SET active_provider_id = NULL, debug_mode = 0 WHERE id = 1');
    db.run('DELETE FROM myboteam_ai_credits WHERE id = 1');
  });
  flushDatabase();
}
