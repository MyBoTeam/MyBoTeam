import { getDaemonClient } from '../../daemon-bootstrap';

export async function hasReadyProviderViaDaemon(): Promise<boolean> {
  try {
    const settings = await getDaemonClient().call('provider.getSettings');
    return Object.values(settings.connectedProviders).some(
      (p) => p?.connectionStatus === 'connected' && !!p.selectedModelId,
    );
  } catch {
    return false;
  }
}
