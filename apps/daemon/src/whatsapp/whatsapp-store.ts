import fs from 'node:fs';
import path from 'node:path';
import type { BaileysChat, BaileysEventEmitter, BaileysMessage } from './baileys-types.js';

interface PersistedChat {
  id: string;
  name?: string | null;
  conversationTimestamp?: number | null;
}

interface PersistedMessage {
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
  messageTimestamp?: number | null;
}

interface PersistedData {
  chats: PersistedChat[];
  messages: Record<string, Record<string, PersistedMessage>>;
}

function toNumber(val: unknown): number | null | undefined {
  if (typeof val === 'number') return val;
  if (val != null && typeof (val as { toNumber: () => number }).toNumber === 'function')
    return (val as { toNumber: () => number }).toNumber();
  return val as number | null | undefined;
}

const SAVE_DEBOUNCE_MS = 2000;

export function createStore(storePath?: string): {
  bind(ev: BaileysEventEmitter): void;
  chats: { all(): BaileysChat[] };
  messages: Record<string, { all(): BaileysMessage[] }>;
} {
  const chatsMap = new Map<string, BaileysChat>();
  const messagesMap = new Map<string, Map<string, BaileysMessage>>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let serializing = false;

  function ensureMessageMap(jid: string): Map<string, BaileysMessage> {
    let map = messagesMap.get(jid);
    if (!map) {
      map = new Map();
      messagesMap.set(jid, map);
    }
    return map;
  }

  function toChat(raw: Record<string, unknown>): BaileysChat {
    return {
      id: (raw.id as string) ?? '',
      name: raw.name as string | null | undefined,
      conversationTimestamp: raw.conversationTimestamp,
    };
  }

  function toMessage(raw: Record<string, unknown>): BaileysMessage {
    return {
      key: raw.key as BaileysMessage['key'],
      message: raw.message as BaileysMessage['message'],
      messageTimestamp: raw.messageTimestamp,
    };
  }

  function msgId(msg: BaileysMessage): string | null {
    const key = msg.key as { id?: string | null } | null;
    return key?.id ?? null;
  }

  function persistChat(c: BaileysChat): PersistedChat {
    return {
      id: c.id,
      name: c.name,
      conversationTimestamp: toNumber(c.conversationTimestamp),
    };
  }

  function persistMessage(m: BaileysMessage): PersistedMessage {
    const k = m.key as { id?: string | null; remoteJid?: string | null; fromMe?: boolean | null; participant?: string | null } | null;
    return {
      key: k
        ? {
            fromMe: k.fromMe ?? null,
            participant: k.participant ?? null,
            remoteJid: k.remoteJid ?? null,
            id: k.id ?? null,
          }
        : null,
      message: m.message as PersistedMessage['message'],
      messageTimestamp: toNumber(m.messageTimestamp),
    };
  }

  function debouncedSave(): void {
    if (!storePath) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => doSave(), SAVE_DEBOUNCE_MS);
  }

  function doSave(): void {
    if (!storePath || serializing) return;
    serializing = true;
    try {
      const data: PersistedData = {
        chats: Array.from(chatsMap.values()).map(persistChat),
        messages: {},
      };
      for (const [jid, msgMap] of messagesMap) {
        const inner: Record<string, PersistedMessage> = {};
        for (const [id, msg] of msgMap) {
          inner[id] = persistMessage(msg);
        }
        data.messages[jid] = inner;
      }
      const dir = path.dirname(storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(storePath, JSON.stringify(data), 'utf-8');
    } catch (err) {
      // Silently handle persistence errors
    } finally {
      serializing = false;
    }
  }

  function loadPersisted(): void {
    if (!storePath) return;
    try {
      const raw = fs.readFileSync(storePath, 'utf-8');
      const data = JSON.parse(raw) as PersistedData;
      if (data.chats) {
        for (const c of data.chats) {
          if (!c.id) continue;
          chatsMap.set(c.id, {
            id: c.id,
            name: c.name,
            conversationTimestamp: c.conversationTimestamp,
          });
        }
      }
      if (data.messages) {
        for (const [jid, inner] of Object.entries(data.messages)) {
          if (!jid) continue;
          const map = new Map<string, BaileysMessage>();
          for (const [id, m] of Object.entries(inner)) {
            if (!id) continue;
            map.set(id, {
              key: m.key,
              message: m.message,
              messageTimestamp: m.messageTimestamp,
            });
          }
          if (map.size > 0) {
            messagesMap.set(jid, map);
          }
        }
      }
    } catch {
      // No persisted data, start fresh
    }
  }

  loadPersisted();

  return {
    bind(ev: BaileysEventEmitter): void {
      ev.on('messaging-history.set', (data: unknown) => {
        const { chats, messages } = data as {
          chats?: Record<string, unknown>[];
          messages?: Record<string, unknown>[];
        };

        if (chats) {
          chatsMap.clear();
          for (const chat of chats) {
            const id = (chat.id as string) ?? '';
            if (!id) continue;
            chatsMap.set(id, toChat(chat));
          }
        }

        if (messages) {
          messagesMap.clear();
          for (const msg of messages) {
            const key = msg.key as Record<string, unknown> | null;
            const jid = (key?.remoteJid as string) ?? '';
            if (!jid) continue;
            const stored = toMessage(msg);
            const id = msgId(stored);
            if (id) {
              ensureMessageMap(jid).set(id, stored);
            }
          }
        }

        doSave();
      });

      ev.on('chats.upsert', (data: unknown) => {
        const chats = data as Record<string, unknown>[];
        for (const chat of chats) {
          const id = (chat.id as string) ?? '';
          if (!id) continue;
          chatsMap.set(id, toChat(chat));
        }
        debouncedSave();
      });

      ev.on('chats.update', (data: unknown) => {
        const updates = data as Record<string, unknown>[];
        for (const update of updates) {
          const id = (update.id as string) ?? '';
          if (!id) continue;
          const existing = chatsMap.get(id);
          if (!existing) continue;
          if (update.name !== undefined) {
            existing.name = update.name as string | null | undefined;
          }
          if (update.conversationTimestamp !== undefined) {
            existing.conversationTimestamp = update.conversationTimestamp;
          }
        }
      });

      ev.on('chats.delete', (data: unknown) => {
        const ids = data as string[];
        for (const id of ids) {
          chatsMap.delete(id);
          messagesMap.delete(id);
        }
        debouncedSave();
      });

      ev.on('messages.upsert', (data: unknown) => {
        const { messages } = data as { messages: Record<string, unknown>[] };
        for (const raw of messages) {
          const key = raw.key as Record<string, unknown> | null;
          const jid = (key?.remoteJid as string) ?? '';
          if (!jid) continue;
          const stored = toMessage(raw);
          const id = msgId(stored);
          if (id) {
            ensureMessageMap(jid).set(id, stored);
          }
        }
        debouncedSave();
      });

      ev.on('messages.update', (data: unknown) => {
        const updates = data as { key: Record<string, unknown>; update: Record<string, unknown> }[];
        for (const { key, update } of updates) {
          const jid = (key.remoteJid as string) ?? '';
          if (!jid) continue;
          const msgIdKey = key.id as string | undefined;
          if (!msgIdKey) continue;
          const map = messagesMap.get(jid);
          if (!map) continue;
          const existing = map.get(msgIdKey);
          if (existing && update) {
            Object.assign(existing, update);
          }
        }
      });

      ev.on('messages.delete', (data: unknown) => {
        const deleted = data as
          | { keys: Array<{ remoteJid?: string | null; id?: string | null }> }
          | { jid: string | null; all: boolean };
        if ('keys' in deleted) {
          for (const key of deleted.keys) {
            const jid = key?.remoteJid ?? '';
            if (!jid) continue;
            const msgIdKey = key?.id;
            if (!msgIdKey) continue;
            const map = messagesMap.get(jid);
            if (map) map.delete(msgIdKey);
          }
        } else if ('all' in deleted && deleted.all && deleted.jid) {
          messagesMap.delete(deleted.jid);
        }
        debouncedSave();
      });
    },
    chats: {
      all() {
        return Array.from(chatsMap.values());
      },
    },
    messages: new Proxy({} as Record<string, { all(): BaileysMessage[] }>, {
      get(_target, prop: string) {
        if (typeof prop === 'string' && messagesMap.has(prop)) {
          const map = messagesMap.get(prop)!;
          return { all: () => Array.from(map.values()) };
        }
        return undefined;
      },
    }),
  };
}
