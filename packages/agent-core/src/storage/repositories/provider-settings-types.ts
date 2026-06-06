import type {
  ConnectedProvider,
  ProviderCredentials,
  ProviderId,
} from '../../common/types/providerSettings.js';
import { safeParseJsonWithFallback } from '../../utils/json.js';

export interface ProviderMetaRow {
  id: number;
  active_provider_id: string | null;
  debug_mode: number;
}

export interface ProviderRow {
  provider_id: string;
  connection_status: string;
  selected_model_id: string | null;
  credentials_type: string;
  credentials_data: string | null;
  last_connected_at: string | null;
  available_models: string | null;
  custom_base_url?: string;
}

export function rowToProvider(row: ProviderRow): ConnectedProvider {
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
