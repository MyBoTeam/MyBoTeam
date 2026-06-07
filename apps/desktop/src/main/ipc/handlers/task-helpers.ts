import { getDaemonClient } from '../../daemon-bootstrap';

/**
 * Milestone 5 replacement for the local `storage.hasReadyProvider()`.
 * Route through `provider.getSettings` and apply the same predicate
 * (`connection_status='connected' AND selected_model_id IS NOT NULL`)
 * client-side. Returns false on RPC failure so we fall through to the
 * "no provider configured" error path instead of starting a task that
 * would immediately fail inside the daemon.
 */
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
