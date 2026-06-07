import { getDaemonClient } from '../../daemon-bootstrap';
import { handle } from './utils';

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

export type HaFn = (channel: string, fn: (event: any, ...args: any[]) => Promise<unknown>) => void;

export function createHa(analyticsEnabled: boolean): HaFn {
  return (channel: string, fn: (event: any, ...args: any[]) => Promise<unknown>) => {
    handle(channel, analyticsEnabled ? fn : async () => {});
  };
}
