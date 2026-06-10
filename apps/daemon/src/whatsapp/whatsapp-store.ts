import fs from 'fs';
import type { BaileysChat, BaileysEventEmitter, BaileysMessage } from './baileys-types.js';
import { normalizeMessage } from './whatsapp-store-helpers.js';
import type { ChatSummary, MessageSummary } from './whatsapp-types.js';

const SAVE_DEBOUNCE_MS = 2000;

export interface WhatsAppStore {
  bind(ev: BaileysEventEmitter): void;
  getChats(): ChatSummary[];
  getChat(jid: string): ChatSummary | undefined;
  getMessages(jid: string, limit: number): MessageSummary[];
  clearMessages(): void;
  clearChats(): void;
  save(): void;
  load(): void;
}

interface RawStoreData {
  chats: [string, BaileysChat][];
  messages: [string, [string, BaileysMessage][]][];
}

export function createStore(storePath?: string): WhatsAppStore {
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

  function doSave(): void {
    if (!storePath || serializing) return;
    serializing = true;
    try {
      const data: RawStoreData = {
        chats: Array.from(chatsMap.entries()),
        messages: Array.from(messagesMap.entries()).map(([jid, m]) => [
          jid,
          Array.from(m.entries()),
        ]),
      };
      fs.writeFileSync(storePath, JSON.stringify(data), 'utf-8');
    } catch {
      /* Silently handle persistence errors */
    } finally {
      serializing = false;
    }
  }

  function debouncedSave(): void {
    if (!storePath) return;
    clearTimeout(saveTimer!);
    saveTimer = setTimeout(doSave, SAVE_DEBOUNCE_MS);
  }

  const store: WhatsAppStore = {
    bind(ev: BaileysEventEmitter): void {
      ev.on('messaging-history.set', (d: unknown) => {
        const { chats, messages } = d as { chats?: BaileysChat[]; messages?: BaileysMessage[] };
        chatsMap.clear();
        messagesMap.clear();
        chats?.forEach((c) => {
          if (c.id) chatsMap.set(c.id, c);
        });
        messages?.forEach((m) => {
          const jid = m.key?.remoteJid;
          if (jid) {
            const id = m.key?.id;
            if (id) ensureMessageMap(jid).set(id, m);
          }
        });
        doSave();
      });
      ev.on('chats.upsert', (d: unknown) => {
        (d as BaileysChat[]).forEach((c) => {
          if (c.id) chatsMap.set(c.id, c);
        });
        debouncedSave();
      });
      ev.on('chats.update', (d: unknown) => {
        (d as BaileysChat[]).forEach((u) => {
          if (!u.id) return;
          const e = chatsMap.get(u.id);
          if (e) {
            if (u.name !== undefined) e.name = u.name;
            if (u.conversationTimestamp !== undefined)
              e.conversationTimestamp = u.conversationTimestamp;
          }
        });
      });
      ev.on('chats.delete', (d: unknown) => {
        (d as string[]).forEach((id) => {
          chatsMap.delete(id);
          messagesMap.delete(id);
        });
        debouncedSave();
      });
      ev.on('messages.upsert', (d: unknown) => {
        const { messages } = d as { messages: BaileysMessage[] };
        messages.forEach((m) => {
          const jid = m.key?.remoteJid;
          if (!jid) return;
          const id = m.key?.id;
          if (!id) return;
          const map = ensureMessageMap(jid);
          if (map.has(id)) return;
          map.set(id, m);
        });
        debouncedSave();
      });
      ev.on('messages.update', (d: unknown) => {
        (
          d as {
            key: { remoteJid?: string | null; id?: string | null };
            update: Partial<BaileysMessage>;
          }[]
        ).forEach(({ key, update }) => {
          const jid = key.remoteJid;
          if (!jid) return;
          const id = key.id;
          if (!id) return;
          const map = messagesMap.get(jid);
          if (map) {
            const e = map.get(id);
            if (e && update) Object.assign(e, update);
          }
        });
      });
      ev.on('messages.delete', (d: unknown) => {
        const del = d as
          | { keys?: Array<{ remoteJid?: string | null; id?: string | null }> }
          | { jid?: string | null; all?: boolean };
        if ('keys' in del)
          del.keys?.forEach((k) => {
            const jid = k?.remoteJid;
            if (jid) {
              const id = k?.id;
              if (id) messagesMap.get(jid)?.delete(id);
            }
          });
        else if ('jid' in del && del.all && del.jid) messagesMap.delete(del.jid);
        debouncedSave();
      });
    },

    getChats(): ChatSummary[] {
      return Array.from(chatsMap.values()).map((c) => ({
        jid: c.id,
        name: c.name ?? undefined,
        lastMessageAt: c.conversationTimestamp as number | undefined,
      }));
    },

    getChat(jid: string): ChatSummary | undefined {
      const c = chatsMap.get(jid);
      return c
        ? {
            jid: c.id,
            name: c.name ?? undefined,
            lastMessageAt: c.conversationTimestamp as number | undefined,
          }
        : undefined;
    },

    getMessages(jid: string, limit: number): MessageSummary[] {
      const map = messagesMap.get(jid);
      if (!map) return [];
      return Array.from(map.values())
        .map((m) => normalizeMessage(jid, m))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-limit);
    },

    clearMessages(): void {
      messagesMap.clear();
      debouncedSave();
    },
    clearChats(): void {
      chatsMap.clear();
      debouncedSave();
    },
    save(): void {
      doSave();
    },

    load(): void {
      if (!storePath) return;
      try {
        if (!fs.existsSync(storePath)) return;
        const data = JSON.parse(fs.readFileSync(storePath, 'utf-8')) as RawStoreData;
        data.chats?.forEach(([jid, c]) => chatsMap.set(jid, c));
        data.messages?.forEach(([jid, entries]) => {
          const map = new Map<string, BaileysMessage>();
          entries.forEach(([id, m]) => map.set(id, m));
          messagesMap.set(jid, map);
        });
      } catch {
        /* Silently handle load errors */
      }
    },
  };

  return store;
}
