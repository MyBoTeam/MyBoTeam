import type { CreditUsage } from '../../common/types/gateway.js';
import type {
  ConnectedProvider,
  ProviderCredentials,
  ProviderId,
  ProviderSettings,
} from '../../common/types/providerSettings.js';
import { safeParseJsonWithFallback } from '../../utils/json.js';
import { flushDatabase, getDatabase, withTransaction } from '../database.js';
import { rowFromResult, rowsFromResult, valueFromResult } from '../query-helpers.js';

interface ProviderMetaRow {
  id: number;
  active_provider_id: string | null;
  debug_mode: number;
}

interface ProviderRow {
  provider_id: string;
  connection_status: string;
  selected_model_id: string | null;
  credentials_type: string;
  credentials_data: string | null;
  last_connected_at: string | null;
  available_models: string | null;
  custom_base_url?: string;
}

function getMetaRow(): ProviderMetaRow {
  const db = getDatabase();
  return rowFromResult<ProviderMetaRow>(
    db.exec('SELECT * FROM provider_meta WHERE id = 1'),
  ) as ProviderMetaRow;
}

function rowToProvider(row: ProviderRow): ConnectedProvider {
  const credentials = safeParseJsonWithFallback<ProviderCredentials>(row.credentials_data, {
    type: 'api_key',
    keyPrefix: '',
  })!;

  return {
    providerId: row.provider_id as ProviderId,
    connectionStatus: row.connection_status as ConnectedProvider['connectionStatus'],
    selectedModelId: row.selected_model_id,
    credentials,
    lastConnectedAt: row.last_connected_at || new Date().toISOString(),
    availableModels: (() => {
      const parsed = safeParseJsonWithFallback<Array<{ id: string; name: string }>>(
        row.available_models,
      );
      if (!Array.isArray(parsed)) {
        return undefined;
      }
      const valid = parsed.filter(
        (m) =>
          m !== null &&
          typeof m === 'object' &&
          typeof m.id === 'string' &&
          typeof m.name === 'string',
      );
      return valid;
    })(),
    customBaseUrl: row.custom_base_url || undefined,
  };
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

    if (providerId === 'myboteam-ai') {
      db.run('DELETE FROM myboteam_ai_credits WHERE id = 1');
    }
  });
  flushDatabase();
}

export function updateProviderModel(providerId: ProviderId, modelId: string | null): void {
  const db = getDatabase();
  db.run('UPDATE providers SET selected_model_id = ? WHERE provider_id = ?', [modelId, providerId]);
  flushDatabase();
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

// ─── MyBoTeam AI Credit Cache ──────────────────────────────────────────────

export function getMyboteamAiCredits(): CreditUsage | null {
  const db = getDatabase();
  const row = rowFromResult<{ credits_json: string }>(
    db.exec('SELECT credits_json FROM myboteam_ai_credits WHERE id = 1'),
  );
  if (!row) return null;
  try {
    return JSON.parse(row.credits_json) as CreditUsage;
  } catch {
    return null;
  }
}

export function saveMyboteamAiCredits(usage: CreditUsage): void {
  const db = getDatabase();
  db.run('INSERT OR REPLACE INTO myboteam_ai_credits (id, credits_json) VALUES (1, ?)', [
    JSON.stringify(usage),
  ]);
  flushDatabase();
}

export function clearMyboteamAiCredits(): void {
  const db = getDatabase();
  db.run('DELETE FROM myboteam_ai_credits WHERE id = 1');
  flushDatabase();
}
