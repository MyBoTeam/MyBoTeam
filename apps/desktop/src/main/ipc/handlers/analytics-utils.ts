/**
 * Analytics IPC utilities — shared helpers for analytics handler registration.
 */

import { getDaemonClient } from '../../daemon-bootstrap';
import { handle } from './utils';

/**
 * Look up the currently selected model + provider via the daemon.
 * Used by task-lifecycle analytics events to attach model context.
 */
export async function getSelectedModelContext(): Promise<{
  model?: string;
  provider?: string;
}> {
  try {
    const settings = await getDaemonClient().call('provider.getSettings');
    const activeId = settings.activeProviderId;
    if (!activeId) {
      return {};
    }
    const active = settings.connectedProviders[activeId];
    return {
      provider: activeId,
      model: active?.selectedModelId ?? undefined,
    };
  } catch {
    return {};
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HaFn = (channel: string, fn: (event: any, ...args: any[]) => Promise<unknown>) => void;

/**
 * Create a handler wrapper that either delegates to the real handler or
 * registers a no-op, depending on whether analytics is enabled.
 */
export function createHa(analyticsEnabled: boolean): HaFn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (channel: string, fn: (event: any, ...args: any[]) => Promise<unknown>) => {
    handle(channel, analyticsEnabled ? fn : async () => {});
  };
}
