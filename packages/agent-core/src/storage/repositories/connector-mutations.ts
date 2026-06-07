import type { ConnectorStatus, McpConnector } from '../../common/types/connector.js';
import { flushDatabase, getDatabase } from '../database.js';

export function upsertConnector(connector: McpConnector): void {
  const db = getDatabase();
  db.run(
    `INSERT INTO connectors (id, name, url, status, is_enabled, oauth_metadata_json, client_registration_json, last_connected_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      url = excluded.url,
      status = excluded.status,
      is_enabled = excluded.is_enabled,
      oauth_metadata_json = excluded.oauth_metadata_json,
      client_registration_json = excluded.client_registration_json,
      last_connected_at = excluded.last_connected_at,
      updated_at = excluded.updated_at`,
    [
      connector.id,
      connector.name,
      connector.url,
      connector.status,
      connector.isEnabled ? 1 : 0,
      connector.oauthMetadata ? JSON.stringify(connector.oauthMetadata) : null,
      connector.clientRegistration ? JSON.stringify(connector.clientRegistration) : null,
      connector.lastConnectedAt || null,
      connector.createdAt,
      connector.updatedAt,
    ],
  );
  flushDatabase();
}

export function setConnectorEnabled(id: string, enabled: boolean): void {
  const db = getDatabase();
  db.run('UPDATE connectors SET is_enabled = ?, updated_at = ? WHERE id = ?', [
    enabled ? 1 : 0,
    new Date().toISOString(),
    id,
  ]);
  flushDatabase();
}

export function setConnectorStatus(id: string, status: ConnectorStatus): void {
  const db = getDatabase();
  db.run('UPDATE connectors SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    new Date().toISOString(),
    id,
  ]);
  flushDatabase();
}

export function deleteConnector(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM connectors WHERE id = ?', [id]);
  flushDatabase();
}

export function clearAllConnectors(): void {
  const db = getDatabase();
  db.run('DELETE FROM connectors');
  flushDatabase();
}
