import type {
  ConnectorStatus,
  McpConnector,
  OAuthClientRegistration,
  OAuthMetadata,
} from '../../common/types/connector.js';
import { createConsoleLogger } from '../../utils/logging.js';

export const log = createConsoleLogger({ prefix: 'Connectors' });

export interface ConnectorRow {
  id: string;
  name: string;
  url: string;
  status: string;
  is_enabled: number;
  oauth_metadata_json: string | null;
  client_registration_json: string | null;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export function safeJsonParse<T>(json: string | null): T | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    log.error('Failed to parse JSON from database', {
      error: error instanceof Error ? error.message : String(error),
      payloadLength: json.length,
    });
    return undefined;
  }
}

export function rowToConnector(row: ConnectorRow): McpConnector {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    status: row.status as ConnectorStatus,
    isEnabled: row.is_enabled === 1,
    oauthMetadata: safeJsonParse<OAuthMetadata>(row.oauth_metadata_json),
    clientRegistration: safeJsonParse<OAuthClientRegistration>(row.client_registration_json),
    lastConnectedAt: row.last_connected_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
