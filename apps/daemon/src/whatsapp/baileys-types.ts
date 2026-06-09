export interface BaileysSocket {
  ev: BaileysEventEmitter;
  user?: { id?: string; lid?: string };
  sendMessage(jid: string, content: Record<string, unknown>): Promise<unknown>;
  sendPresenceUpdate(action: string, jid: string): Promise<void>;
  readMessages(keys: Array<{ remoteJid: string; id: string; fromMe: boolean }>): Promise<void>;
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
  on(event: 'messaging-history.set', handler: (data: unknown) => void): void;
  on(event: 'chats.upsert', handler: (data: unknown) => void): void;
  on(event: 'chats.update', handler: (data: unknown) => void): void;
  on(event: 'chats.delete', handler: (data: unknown) => void): void;
  on(event: 'messages.update', handler: (data: unknown) => void): void;
  on(event: 'messages.delete', handler: (data: unknown) => void): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(
    event: 'messages.upsert',
    handler: (upsert: { type: string; messages: unknown[] }) => void,
  ): void;
  off(event: 'messaging-history.set', handler: (data: unknown) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  removeAllListeners(event?: string): void;
}

export type { BaileysEventEmitter };

export interface BaileysStore {
  bind(ev: BaileysEventEmitter): void;
  chats: { all(): BaileysChat[] };
  messages: Record<string, { all(): BaileysMessage[] }>;
}

export interface BaileysChat {
  id: string;
  name?: string | null;
  conversationTimestamp: unknown;
}

export interface BaileysMessage {
  key?: {
    fromMe?: boolean | null;
    participant?: string | null;
    remoteJid?: string | null;
    id?: string | null;
  } | null;
  message?: {
    conversation?: string | null;
    extendedTextMessage?: { text?: string | null } | null;
  } | null;
  messageTimestamp?: unknown;
}
