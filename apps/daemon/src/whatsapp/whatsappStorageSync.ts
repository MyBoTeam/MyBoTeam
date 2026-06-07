import type { StorageAPI } from '@myboteam/agent-core';
import type { TaskBridge } from './taskBridge.js';
import type { WhatsAppService } from './WhatsAppService.js';

export function wireStatusListeners(
  service: WhatsAppService,
  storage: StorageAPI,
  _bridge: TaskBridge,
): void {
  service.on('phoneNumber', (phoneNumber: string) => {
    const config = storage.getMessagingConfig();
    storage.setMessagingConfig({
      integrations: {
        ...(config?.integrations ?? {}),
        whatsapp: {
          ...(config?.integrations?.whatsapp ?? {
            platform: 'whatsapp',
            enabled: true,
            tunnelEnabled: false,
          }),
          phoneNumber,
          lastConnectedAt: Date.now(),
        },
      },
    });
  });

  service.on('status', (status: string) => {
    if (status === 'connected') {
      const config = storage.getMessagingConfig();
      storage.setMessagingConfig({
        integrations: {
          ...(config?.integrations ?? {}),
          whatsapp: {
            ...(config?.integrations?.whatsapp ?? {
              platform: 'whatsapp',
              enabled: true,
              tunnelEnabled: false,
            }),
            connectionStatus: 'connected',
            lastConnectedAt: Date.now(),
          },
        },
      });
    }
  });
}
