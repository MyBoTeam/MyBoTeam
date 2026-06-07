import type { IpcMainInvokeEvent } from 'electron';
import { getDaemonClient } from '../../daemon-bootstrap';
import type { IpcHandler } from '../types';

export function registerWhatsAppHandlers(handle: IpcHandler): void {
  handle('integrations:whatsapp:get-config', async (_event: IpcMainInvokeEvent) => {
    const client = getDaemonClient();
    return client.call('whatsapp.getConfig');
  });

  handle('integrations:whatsapp:connect', async (_event: IpcMainInvokeEvent) => {
    const client = getDaemonClient();
    await client.call('whatsapp.connect');
  });

  handle('integrations:whatsapp:disconnect', async (_event: IpcMainInvokeEvent) => {
    const client = getDaemonClient();
    await client.call('whatsapp.disconnect');
  });

  handle(
    'integrations:whatsapp:set-enabled',
    async (_event: IpcMainInvokeEvent, enabled: boolean) => {
      const client = getDaemonClient();
      await client.call('whatsapp.setEnabled', { enabled });
    },
  );
}
