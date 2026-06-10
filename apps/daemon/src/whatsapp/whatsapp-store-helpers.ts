import type { BaileysChat, BaileysEventEmitter, BaileysMessage } from './baileys-types.js';
import type { ChatSummary, MessageSummary, MessageType } from './whatsapp-types.js';
import { toTimestamp } from './whatsapp-types.js';

export function getMessageType(msg: BaileysMessage): MessageType {
  if (!msg.message) return 'text';
  if (msg.message.conversation || msg.message.extendedTextMessage) return 'text';
  if (msg.message.imageMessage) return 'image';
  if (msg.message.videoMessage) return 'video';
  if (msg.message.audioMessage) return 'audio';
  if (msg.message.documentMessage) return 'document';
  if (msg.message.stickerMessage) return 'sticker';
  if (msg.message.reactionMessage) return 'reaction';
  if (msg.message.locationMessage) return 'location';
  if (msg.message.contactMessage) return 'contact';
  if (msg.message.systemMessage) return 'system';
  return 'text';
}

export function extractText(msg: BaileysMessage): string {
  const m = msg.message;
  if (!m) return '';

  if (m.conversation || m.extendedTextMessage) {
    return m.conversation ?? m.extendedTextMessage?.text ?? '';
  }
  if (m.imageMessage) {
    const caption = m.imageMessage.caption;
    return caption ? `📷 Image: ${caption}` : '📷 Image';
  }
  if (m.videoMessage) {
    const caption = m.videoMessage.caption;
    return caption ? `🎥 Video: ${caption}` : '🎥 Video';
  }
  if (m.audioMessage) return '🎤 Audio';
  if (m.documentMessage) {
    const name = m.documentMessage.fileName;
    return name ? `📄 ${name}` : '📄 Document';
  }
  if (m.stickerMessage) return '😊 Sticker';
  if (m.reactionMessage) {
    const emoji = m.reactionMessage.text ?? '';
    return `${emoji} react`;
  }
  if (m.locationMessage) return '📍 Location';
  if (m.contactMessage) {
    const name = m.contactMessage.displayName;
    return name ? `👤 Contact: ${name}` : '👤 Contact';
  }
  if (m.systemMessage) return m.systemMessage.body ?? '';
  return '';
}

export function normalizeMessage(jid: string, msg: BaileysMessage) {
  return {
    messageId: msg.key?.id ?? '',
    senderJid: msg.key?.participant ?? jid,
    fromMe: msg.key?.fromMe ?? false,
    text: extractText(msg),
    timestamp: toTimestamp(msg.messageTimestamp) ?? 0,
    messageType: getMessageType(msg),
  };
}

export interface WhatsAppStore {
  bind(ev: BaileysEventEmitter): void;
  getChats(): ChatSummary[];
  getChat(jid: string): ChatSummary | undefined;
  getMessages(jid: string, limit: number): MessageSummary[];
  getRawMessages(jid: string, limit: number): BaileysMessage[];
  clearMessages(): void;
  clearChats(): void;
  save(): void;
  load(): void;
}

export interface RawStoreData {
  chats: [string, BaileysChat][];
  messages: [string, [string, BaileysMessage][]][];
}
