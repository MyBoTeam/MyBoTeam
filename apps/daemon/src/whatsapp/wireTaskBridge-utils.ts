import type { StorageAPI } from '@myboteam/agent-core';

export function getWatermark(storage: StorageAPI): {
  lastProcessedAt: number;
  lastProcessedMessageId: string | null;
} {
  const config = storage.getMessagingConfig();
  const wa = config?.integrations?.whatsapp;
  return {
    lastProcessedAt: (wa?.lastProcessedAt as number) ?? 0,
    lastProcessedMessageId: (wa?.lastProcessedMessageId as string) ?? null,
  };
}

export function setWatermark(storage: StorageAPI, timestamp: number, messageId: string): void {
  const config = storage.getMessagingConfig();
  if (!config?.integrations?.whatsapp) {
    return;
  }
  storage.setMessagingConfig({
    integrations: {
      ...(config.integrations ?? {}),
      whatsapp: {
        ...(config.integrations.whatsapp ?? {}),
        lastProcessedAt: timestamp,
        lastProcessedMessageId: messageId,
      },
    },
  });
}
