import type { BaileysMessage, BaileysStore } from './baileys-types.js';
import { type ChatSummary, type MessageSummary, toTimestamp } from './whatsapp-types.js';

export function getChats(store: BaileysStore | null, limit: number): ChatSummary[] {
  if (!store) return [];
  return store.chats
    .all()
    .slice(0, limit)
    .map((c) => ({
      jid: c.id,
      name: c.name ?? undefined,
      lastMessageAt: toTimestamp(c.conversationTimestamp),
    }));
}

export function getMessages(
  store: BaileysStore | null,
  jid: string,
  limit: number,
): MessageSummary[] {
  if (!store) return [];
  const msgs: BaileysMessage[] = store.messages[jid]?.all() ?? [];
  return msgs.slice(-limit).flatMap((m) => {
    const text = m.message?.conversation ?? m.message?.extendedTextMessage?.text;
    if (!text) return [];
    return [
      {
        messageId: m.key?.id ?? '',
        senderJid: m.key?.fromMe ? 'me' : (m.key?.participant ?? m.key?.remoteJid ?? jid),
        fromMe: Boolean(m.key?.fromMe),
        text,
        timestamp: toTimestamp(m.messageTimestamp) ?? 0,
      },
    ];
  });
}

export function getGroups(
  store: BaileysStore | null,
  limit: number,
): Array<{ jid: string; name?: string; participants: number }> {
  if (!store) return [];
  return store.chats
    .all()
    .filter((c) => c.id.endsWith('@g.us'))
    .slice(0, limit)
    .map((c) => ({
      jid: c.id,
      name: c.name ?? undefined,
      participants: 0,
    }));
}

export function getGroupInfo(
  store: BaileysStore | null,
  groupJid: string,
): { jid: string; name?: string } | null {
  if (!store) return null;
  const chat = store.chats.all().find((c) => c.id === groupJid);
  if (!chat) return null;
  return { jid: chat.id, name: chat.name ?? undefined };
}
