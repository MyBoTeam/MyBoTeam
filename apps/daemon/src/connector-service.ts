import type {
  ConnectorStatus,
  McpConnector,
  OAuthTokens,
  StorageAPI,
  StoredAuthEntry,
} from '@myboteam/agent-core';

const AUTH_ENTRY_PREFIX = 'connector-auth:';

function authEntryKey(connectorKey: string): string {
  return `${AUTH_ENTRY_PREFIX}${connectorKey}`;
}

export class ConnectorService {
  constructor(private readonly storage: StorageAPI) {}

  list(): McpConnector[] {
    return this.storage.getAllConnectors();
  }

  getEnabled(): McpConnector[] {
    return this.storage.getEnabledConnectors();
  }

  getById(id: string): McpConnector | null {
    return this.storage.getConnectorById(id);
  }

  upsert(connector: McpConnector): void {
    this.storage.upsertConnector(connector);
  }

  setEnabled(id: string, enabled: boolean): void {
    this.storage.setConnectorEnabled(id, enabled);
  }

  setStatus(id: string, status: ConnectorStatus): void {
    this.storage.setConnectorStatus(id, status);
  }

  delete(id: string): void {
    this.storage.deleteConnector(id);
  }

  storeTokens(connectorId: string, tokens: OAuthTokens): void {
    this.storage.storeConnectorTokens(connectorId, tokens);
  }

  getTokens(connectorId: string): OAuthTokens | null {
    return this.storage.getConnectorTokens(connectorId);
  }

  deleteTokens(connectorId: string): void {
    this.storage.deleteConnectorTokens(connectorId);
  }

  readAuthEntry(connectorKey: string): StoredAuthEntry | null {
    const raw = this.storage.get(authEntryKey(connectorKey));
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as StoredAuthEntry;
    } catch {
      return null;
    }
  }

  writeAuthEntry(connectorKey: string, entry: StoredAuthEntry): void {
    this.storage.set(authEntryKey(connectorKey), JSON.stringify(entry));
  }

  deleteAuthEntry(connectorKey: string): void {
    this.storage.set(authEntryKey(connectorKey), '');
  }
}
