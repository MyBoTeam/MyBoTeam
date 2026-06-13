import type { WhatsAppStore } from './whatsapp-store.js';
import type { ChatSummary, MessageSummary } from './whatsapp-types.js';

export function getChats(store: WhatsAppStore | null, limit: number): ChatSummary[] {
  if (!store) return [];
  return store.getChats().slice(0, limit);
}

export function getMessages(
  store: WhatsAppStore | null,
  jid: string,
  limit: number,
): MessageSummary[] {
  if (!store) return [];
  return store.getMessages(jid, limit);
}

export function getGroups(
  store: WhatsAppStore | null,
  limit: number,
): Array<{ jid: string; name?: string; participants: number | null }> {
  if (!store) return [];
  return store
    .getChats()
    .filter((c) => c.jid.endsWith('@g.us'))
    .slice(0, limit)
    .map((c) => ({ jid: c.jid, name: c.name, participants: null }));
}

export function getGroupInfo(
  store: WhatsAppStore | null,
  groupJid: string,
): { jid: string; name?: string } | null {
  if (!store) return null;
  const chat = store.getChat(groupJid);
  if (!chat) return null;
  return { jid: chat.jid, name: chat.name };
}
