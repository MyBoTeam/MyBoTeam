import type { McpConnector } from '../../common/types/connector.js';
import { getDatabase } from '../database.js';
import { rowFromResult, rowsFromResult } from '../query-helpers.js';
import type { ConnectorRow } from './connector-common.js';
import { rowToConnector } from './connector-common.js';

export function getAllConnectors(): McpConnector[] {
  const db = getDatabase();
  const rows = rowsFromResult<ConnectorRow>(
    db.exec('SELECT * FROM connectors ORDER BY created_at DESC'),
  );
  return rows.map(rowToConnector);
}

export function getEnabledConnectors(): McpConnector[] {
  const db = getDatabase();
  const rows = rowsFromResult<ConnectorRow>(
    db.exec('SELECT * FROM connectors WHERE is_enabled = 1 ORDER BY created_at DESC'),
  );
  return rows.map(rowToConnector);
}

export function getConnectorById(id: string): McpConnector | null {
  const db = getDatabase();
  const row = rowFromResult<ConnectorRow>(db.exec('SELECT * FROM connectors WHERE id = ?', [id]));
  return row ? rowToConnector(row) : null;
}
