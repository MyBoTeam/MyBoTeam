import type { IpcMainInvokeEvent } from 'electron';
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

export type HaFn = <Args extends unknown[]>(
  channel: string,
  fn: (event: IpcMainInvokeEvent, ...args: Args) => Promise<unknown>,
) => void;

export function createHa(analyticsEnabled: boolean): HaFn {
  return <Args extends unknown[]>(
    channel: string,
    fn: (event: IpcMainInvokeEvent, ...args: Args) => Promise<unknown>,
  ) => {
    const noop: (event: IpcMainInvokeEvent, ...args: Args) => Promise<unknown> = async () => ({});
    handle(channel, analyticsEnabled ? fn : noop);
  };
}
