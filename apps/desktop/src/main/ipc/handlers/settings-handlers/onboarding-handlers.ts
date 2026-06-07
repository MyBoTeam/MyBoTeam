import type { IpcMainInvokeEvent } from 'electron';
import { getDaemonClient } from '../../../daemon-bootstrap';
import type { IpcHandler } from '../../types';
import { isE2ESkipAuthEnabled } from '../utils';

export function registerOnboardingHandlers(handle: IpcHandler): void {
  handle('onboarding:complete', async (_event: IpcMainInvokeEvent) => {
    if (isE2ESkipAuthEnabled()) {
      return true;
    }

    const client = getDaemonClient();
    const snap = await client.call('settings.getAll');
    if (snap.app.onboardingComplete) {
      return true;
    }

    const tasks = await client.call('task.list', {});
    if (tasks.length > 0) {
      await client.call('settings.setOnboardingComplete', { complete: true });
      return true;
    }

    return false;
  });

  handle('onboarding:set-complete', async (_event: IpcMainInvokeEvent, complete: boolean) => {
    if (typeof complete !== 'boolean') {
      throw new Error('complete must be a boolean');
    }
    await getDaemonClient().call('settings.setOnboardingComplete', { complete });
  });
}
