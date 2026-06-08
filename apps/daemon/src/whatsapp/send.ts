import fs from 'node:fs/promises';
import path from 'node:path';
import type { BaileysSocket } from './baileys-types.js';
import { toWhatsAppJid } from './normalize.js';

export interface SendMessageOptions {
  mediaPath?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  replyToId?: string;
  asDocument?: boolean;
  gifPlayback?: boolean;
}

function detectMimeType(mediaPath: string, mediaType?: string): string {
  if (mediaType === 'image') return 'image/jpeg';
  if (mediaType === 'audio') return 'audio/ogg';
  if (mediaType === 'video') return 'video/mp4';
  if (mediaType === 'document') return 'application/octet-stream';
  const ext = path.extname(mediaPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}

export async function sendText(
  socket: BaileysSocket,
  recipient: string,
  text: string,
  options?: SendMessageOptions,
): Promise<string> {
  const jid = toWhatsAppJid(recipient);
  let content: Record<string, unknown> = { text };
  if (options?.mediaPath) {
    const mediaBuffer = await fs.readFile(options.mediaPath);
    const mimeType = detectMimeType(options.mediaPath, options.mediaType);

    if (options.asDocument) {
      content = {
        document: mediaBuffer,
        fileName: path.basename(options.mediaPath),
        caption: text,
        mimetype: mimeType,
      };
    } else if (options.mediaType === 'image') {
      content = { image: mediaBuffer, caption: text, mimetype: mimeType };
    } else if (options.mediaType === 'audio') {
      content = { audio: mediaBuffer, ptt: true, mimetype: mimeType };
    } else if (options.mediaType === 'video') {
      content = {
        video: mediaBuffer,
        caption: text,
        mimetype: mimeType,
        ...(options.gifPlayback ? { gifPlayback: true } : {}),
      };
    } else {
      content = {
        document: mediaBuffer,
        fileName: path.basename(options.mediaPath),
        caption: text,
        mimetype: mimeType,
      };
    }
  }
  // biome-ignore lint/suspicious/noExplicitAny: baileys sendMessage accepts dynamic content
  const result = await socket.sendMessage(jid, content as any);
  return (result as { key?: { id?: string } })?.key?.id ?? '';
}

export async function sendReaction(
  socket: BaileysSocket,
  chatJid: string,
  messageId: string,
  emoji: string,
  fromMe: boolean = false,
  participant?: string,
): Promise<void> {
  const jid = toWhatsAppJid(chatJid);
  const reactContent = {
    react: {
      text: emoji,
      key: { remoteJid: jid, id: messageId, fromMe, ...(participant ? { participant } : {}) },
    },
    // biome-ignore lint/suspicious/noExplicitAny: baileys accepts reaction type
  } as any;
  await socket.sendMessage(jid, reactContent);
}

export async function sendPoll(
  socket: BaileysSocket,
  recipient: string,
  question: string,
  options: string[],
  maxSelections: number = 1,
): Promise<string> {
  if (options.length < 2 || options.length > 12)
    throw new Error('Poll options must be between 2 and 12');
  const jid = toWhatsAppJid(recipient);
  const pollContent = {
    poll: { name: question, values: options, selectableCount: maxSelections },
    // biome-ignore lint/suspicious/noExplicitAny: baileys accepts poll type
  } as any;
  const result = await socket.sendMessage(jid, pollContent);
  return (result as { key?: { id?: string } })?.key?.id ?? '';
}

export async function sendTyping(
  socket: BaileysSocket,
  recipient: string,
  action: 'composing' | 'paused' | 'recording' = 'composing',
): Promise<void> {
  const jid = toWhatsAppJid(recipient);
  await socket.sendPresenceUpdate(action, jid);
}

export async function markMessagesRead(
  socket: BaileysSocket,
  chatJid: string,
  messageIds: string[],
): Promise<void> {
  const jid = toWhatsAppJid(chatJid);
  await socket.readMessages(messageIds.map((id) => ({ remoteJid: jid, id, fromMe: false })));
}
