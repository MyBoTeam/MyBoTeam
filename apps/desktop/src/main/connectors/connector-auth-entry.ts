import type { ConnectorAuthStoreConfig } from '@myboteam/agent-core/common';
import { getDaemonClient } from '../daemon-bootstrap';
import type { StoredAuthEntry } from './connector-auth-types';

export async function readEntry(
  config: ConnectorAuthStoreConfig,
): Promise<StoredAuthEntry | undefined> {
  const entry = await getDaemonClient().call('connectors.authEntry.read', {
    connectorKey: config.key,
  });
  return entry ?? undefined;
}

export async function writeEntry(
  config: ConnectorAuthStoreConfig,
  entry: StoredAuthEntry,
): Promise<void> {
  await getDaemonClient().call('connectors.authEntry.write', {
    connectorKey: config.key,
    entry,
  });
}

export async function deleteEntry(config: ConnectorAuthStoreConfig): Promise<void> {
  await getDaemonClient().call('connectors.authEntry.delete', {
    connectorKey: config.key,
  });
}

export function resolveServerUrl(
  config: ConnectorAuthStoreConfig,
  existing: StoredAuthEntry,
): string | undefined {
  if (config.serverUrl) {
    return config.serverUrl;
  }
  if (config.storesServerUrl && existing.serverUrl) {
    return existing.serverUrl;
  }
  return undefined;
}
