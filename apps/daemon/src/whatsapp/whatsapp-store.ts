import type { BaileysChat, BaileysEventEmitter, BaileysMessage } from './baileys-types.js';

export function createStore(): {
  bind(ev: BaileysEventEmitter): void;
  chats: { all(): BaileysChat[] };
  messages: Record<string, { all(): BaileysMessage[] }>;
} {
  const chatsMap = new Map<string, BaileysChat>();
  const messagesMap = new Map<string, BaileysMessage[]>();

  function ensureMessageList(jid: string): BaileysMessage[] {
    let list = messagesMap.get(jid);
    if (!list) {
      list = [];
      messagesMap.set(jid, list);
    }
    return list;
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
            ensureMessageList(jid).push(toMessage(msg));
          }
        }
      });

      ev.on('chats.upsert', (data: unknown) => {
        const chats = data as Record<string, unknown>[];
        for (const chat of chats) {
          const id = (chat.id as string) ?? '';
          if (!id) continue;
          chatsMap.set(id, toChat(chat));
        }
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
      });

      ev.on('messages.upsert', (data: unknown) => {
        const { messages } = data as { messages: Record<string, unknown>[] };
        for (const msg of messages) {
          const key = msg.key as Record<string, unknown> | null;
          const jid = (key?.remoteJid as string) ?? '';
          if (!jid) continue;
          ensureMessageList(jid).push(toMessage(msg));
        }
      });

      ev.on('messages.update', (data: unknown) => {
        const updates = data as { key: Record<string, unknown>; update: Record<string, unknown> }[];
        for (const { key, update } of updates) {
          const jid = (key.remoteJid as string) ?? '';
          if (!jid) continue;
          const msgId = key.id as string | undefined;
          if (!msgId) continue;
          const msgs = messagesMap.get(jid);
          if (!msgs) continue;
          const idx = msgs.findIndex((m) => {
            const mk = m.key as { id?: string | null } | null;
            return mk?.id === msgId;
          });
          if (idx !== -1 && update) {
            Object.assign(msgs[idx], update);
          }
        }
      });

      ev.on('messages.delete', (data: unknown) => {
        const deleted = data as
          | { keys: Array<{ remoteJid?: string | null; id?: string | null }> }
          | { jid: string; all: boolean };
        if ('keys' in deleted) {
          for (const key of deleted.keys) {
            const jid = key?.remoteJid ?? '';
            if (!jid) continue;
            const msgId = key?.id;
            if (!msgId) continue;
            const msgs = messagesMap.get(jid);
            if (!msgs) continue;
            const idx = msgs.findIndex((m) => {
              const mk = m.key as { id?: string | null } | null;
              return mk?.id === msgId;
            });
            if (idx !== -1) msgs.splice(idx, 1);
          }
        }
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
          return { all: () => messagesMap.get(prop) ?? [] };
        }
        return undefined;
      },
    }),
  };
}
