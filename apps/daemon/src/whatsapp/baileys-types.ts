export interface BaileysSocket {
  ev: BaileysEventEmitter;
  user?: { id?: string; lid?: string };
  sendMessage(jid: string, content: { text: string }): Promise<unknown>;
  end(error: Error): void;
  logout(): Promise<void>;
}

interface BaileysEventEmitter {
  on(event: 'creds.update', handler: () => void): void;
  on(
    event: 'connection.update',
    handler: (update: {
      connection?: string;
      lastDisconnect?: { error?: unknown };
      qr?: string;
    }) => void,
  ): void;
  on(
    event: 'messages.upsert',
    handler: (upsert: { type: string; messages: unknown[] }) => void,
  ): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeAllListeners(event?: string): void;
}

export interface BaileysStore {
  bind(ev: BaileysEventEmitter): void;
  chats: { all(): BaileysChat[] };
  messages: Record<string, { all(): BaileysMessage[] }>;
}

export interface BaileysChat {
  id: string;
  name?: string;
  conversationTimestamp: unknown;
}

export interface BaileysMessage {
  key?: {
    fromMe?: boolean;
    participant?: string;
    remoteJid?: string;
    id?: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
  };
  messageTimestamp?: unknown;
}
