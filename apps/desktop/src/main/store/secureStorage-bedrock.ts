import { getDaemonClient } from '../daemon/daemon-lifecycle';

export async function getBedrockCredentials(): Promise<Record<string, string> | null> {
  return getDaemonClient().call('secrets.getBedrockCredentials');
}

export async function storeBedrockCredentials(credentials: string): Promise<void> {
  await getDaemonClient().call('secrets.storeBedrockCredentials', { credentials });
}

export function clearSecureStorage(): void {}
