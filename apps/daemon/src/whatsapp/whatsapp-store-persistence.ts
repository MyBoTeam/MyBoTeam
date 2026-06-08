import fs from 'node:fs';
import path from 'node:path';
import type { BaileysChat, BaileysMessage } from './baileys-types.js';

export interface PersistedChat {
  id: string;
  name?: string | null;
  conversationTimestamp?: number | null;
}

export interface PersistedMessage {
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

export interface PersistedData {
  chats: PersistedChat[];
  messages: Record<string, Record<string, PersistedMessage>>;
}

export function toNumber(val: unknown): number | null | undefined {
  if (typeof val === 'number') return val;
  if (val != null && typeof (val as { toNumber: () => number }).toNumber === 'function')
    return (val as { toNumber: () => number }).toNumber();
  return val as number | null | undefined;
}

export function persistChat(c: BaileysChat): PersistedChat {
  return {
    id: c.id,
    name: c.name,
    conversationTimestamp: toNumber(c.conversationTimestamp),
  };
}

export function persistMessage(m: BaileysMessage): PersistedMessage {
  const k = m.key as {
    id?: string | null;
    remoteJid?: string | null;
    fromMe?: boolean | null;
    participant?: string | null;
  } | null;
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

export function saveStore(
  storePath: string,
  chatsMap: Map<string, BaileysChat>,
  messagesMap: Map<string, Map<string, BaileysMessage>>,
): void {
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
}

export function loadStore(storePath: string): {
  chats: Map<string, BaileysChat>;
  messages: Map<string, Map<string, BaileysMessage>>;
} | null {
  try {
    const raw = fs.readFileSync(storePath, 'utf-8');
    const data = JSON.parse(raw) as PersistedData;
    const chats = new Map<string, BaileysChat>();
    const messages = new Map<string, Map<string, BaileysMessage>>();

    if (data.chats) {
      for (const c of data.chats) {
        if (!c.id) continue;
        chats.set(c.id, {
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
          messages.set(jid, map);
        }
      }
    }

    return { chats, messages };
  } catch {
    return null;
  }
}
