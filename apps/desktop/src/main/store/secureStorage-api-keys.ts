import type { ApiKeyProvider } from '@myboteam/agent-core/desktop-main';
import { getDaemonClient } from '../daemon/daemon-lifecycle';

export type { ApiKeyProvider };

export async function storeApiKey(provider: string, apiKey: string): Promise<void> {
  await getDaemonClient().call('secrets.storeApiKey', { provider, apiKey });
}

export async function getApiKey(provider: string): Promise<string | null> {
  return getDaemonClient().call('secrets.getApiKey', { provider });
}

export async function deleteApiKey(provider: string): Promise<boolean> {
  return getDaemonClient().call('secrets.deleteApiKey', { provider });
}

export async function getAllApiKeys(): Promise<Record<string, string | null>> {
  return getDaemonClient().call('secrets.getAllApiKeys');
}

export async function hasAnyApiKey(): Promise<boolean> {
  return getDaemonClient().call('secrets.hasAnyApiKey');
}
