import type { ConnectedProvider, ProviderId } from '../../common/types/providerSettings.js';
import { flushDatabase, getDatabase, withTransaction } from '../database.js';
import { rowFromResult, rowsFromResult, valueFromResult } from '../query-helpers.js';
import { getActiveProviderId, getMetaRow } from './provider-settings-meta.js';
import type { ProviderRow } from './provider-settings-types.js';
import { rowToProvider } from './provider-settings-types.js';

export function getConnectedProvider(providerId: ProviderId): ConnectedProvider | null {
  const db = getDatabase();
  const row = rowFromResult<ProviderRow>(
    db.exec('SELECT * FROM providers WHERE provider_id = ?', [providerId]),
  );

  return row ? rowToProvider(row) : null;
}

export function setConnectedProvider(providerId: ProviderId, provider: ConnectedProvider): void {
  const db = getDatabase();
  db.run(
    `INSERT OR REPLACE INTO providers
      (provider_id, connection_status, selected_model_id, credentials_type, credentials_data, last_connected_at, available_models, custom_base_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      providerId,
      provider.connectionStatus,
      provider.selectedModelId,
      provider.credentials.type,
      JSON.stringify(provider.credentials),
      provider.lastConnectedAt,
      provider.availableModels ? JSON.stringify(provider.availableModels) : null,
      provider.customBaseUrl ?? null,
    ],
  );
  flushDatabase();
}

export function removeConnectedProvider(providerId: ProviderId): void {
  const db = getDatabase();

  withTransaction(db, () => {
    db.run('DELETE FROM providers WHERE provider_id = ?', [providerId]);

    const meta = getMetaRow();
    if (meta.active_provider_id === providerId) {
      db.run('UPDATE provider_meta SET active_provider_id = NULL WHERE id = 1');
    }
  });
  flushDatabase();
}

export function updateProviderModel(providerId: ProviderId, modelId: string | null): void {
  const db = getDatabase();
  db.run('UPDATE providers SET selected_model_id = ? WHERE provider_id = ?', [modelId, providerId]);
  flushDatabase();
}

export function getActiveProviderModel(): {
  provider: ProviderId;
  model: string;
  baseUrl?: string;
} | null {
  const activeId = getActiveProviderId();
  if (!activeId) return null;

  const provider = getConnectedProvider(activeId);
  if (!provider?.selectedModelId) return null;

  const result: { provider: ProviderId; model: string; baseUrl?: string } = {
    provider: activeId,
    model: provider.selectedModelId,
  };

  if (provider.credentials.type === 'ollama') {
    result.baseUrl = provider.credentials.serverUrl;
  } else if (provider.credentials.type === 'litellm') {
    result.baseUrl = provider.credentials.serverUrl;
  }

  return result;
}

export function hasReadyProvider(): boolean {
  const db = getDatabase();
  const count = valueFromResult<number>(
    db.exec(
      `SELECT COUNT(*) as count FROM providers
     WHERE connection_status = 'connected' AND selected_model_id IS NOT NULL`,
    ),
  );
  return (count ?? 0) > 0;
}

export function getConnectedProviderIds(): ProviderId[] {
  const db = getDatabase();
  const rows = rowsFromResult<{ provider_id: string }>(
    db.exec("SELECT provider_id FROM providers WHERE connection_status = 'connected'"),
  );

  return rows.map((r) => r.provider_id as ProviderId);
}
