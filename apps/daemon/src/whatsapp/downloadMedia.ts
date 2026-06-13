import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import type { WhatsAppStore } from './whatsapp-store.js';

export async function downloadMedia(
  store: WhatsAppStore,
  storePath: string,
  chatJid: string,
  messageId: string,
): Promise<{ filePath: string; mimeType: string } | null> {
  const msgs = store.getRawMessages(chatJid, 1000);
  const msg = msgs.find((m) => m.key?.id === messageId);
  if (!msg?.message) return null;
  const c = msg.message as Record<string, unknown>;
  let t: string | null = null;
  if (c.imageMessage) {
    t = 'image';
  } else if (c.videoMessage) {
    t = 'video';
  } else if (c.audioMessage) {
    t = 'audio';
  } else if (c.documentMessage) {
    t = 'document';
  }
  if (!t) return null;
  const mk = c[`${t}Message`] as Record<string, unknown>;
  const mime = (mk.mimetype as string) || 'application/octet-stream';
  const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
  // biome-ignore lint/suspicious/noExplicitAny: baileys API accepts dynamic media types
  const stream = (await downloadContentFromMessage(mk as any, t as any)) as NodeJS.ReadableStream;
  const filePath = path.join(
    path.dirname(storePath),
    `media_${messageId}.${mime.split('/')[1] || 'bin'}`,
  );
  const ws = fs.createWriteStream(filePath);
  await new Promise<void>((resolve, reject) => {
    stream.pipe(ws);
    ws.on('finish', () => resolve());
    ws.on('error', (err) => {
      fsPromises.unlink(filePath).catch(() => {});
      reject(err);
    });
  });
  return { filePath, mimeType: mime };
}
