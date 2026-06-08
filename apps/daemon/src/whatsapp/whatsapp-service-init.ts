import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import { log } from '../logger.js';
import type { BaileysSocket, BaileysStore } from './baileys-types.js';
import { normalizeMessage } from './normalizeMessage.js';
import type { ReconnectState } from './reconnection.js';
import { handleConnectionUpdate } from './whatsapp-session.js';
import { createStore } from './whatsapp-store.js';
import type { SentMessageTracker } from './whatsapp-types.js';

export async function initBaileysSocket(
  authStatePath: string,
  storePath: string | undefined,
  disposed: () => boolean,
  onDisconnected: () => void,
) {
  const baileys = await import('@whiskeysockets/baileys');
  if (disposed()) {
    onDisconnected();
    throw new Error('WhatsApp service disposed');
  }
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
  } = baileys;
  const pino = (await import('pino')).default;
  let version: [number, number, number] | undefined;
  try {
    version = (await fetchLatestBaileysVersion()).version;
  } catch (err) {
    log.warn('[WhatsApp] Failed to fetch latest version, using default:', err);
  }
  const { state, saveCreds } = await useMultiFileAuthState(authStatePath);
  if (disposed()) {
    onDisconnected();
    throw new Error('WhatsApp service disposed');
  }
  const socket = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['MyBoTeam', 'Desktop', '1.0.0'],
  });
  if (disposed()) {
    socket.end(new Error('WhatsApp service disposed during connect'));
    throw new Error('WhatsApp service disposed');
  }
  const store: BaileysStore = createStore(storePath);
  store.bind(socket.ev);
  return { socket, store, saveCreds, DisconnectReason, jidNormalizedUser };
}

export function wireSocketEvents(
  socket: BaileysSocket,
  saveCreds: () => void,
  DisconnectReason: Record<string, number>,
  jidNormalizedUser: (jid: string) => string,
  deps: {
    reconnect: ReconnectState;
    authStatePath: string;
    disposed: boolean;
    manualDisconnect: boolean;
    setStatus: (s: MessagingConnectionStatus) => void;
    setQrCode: (qr: string) => void;
    emitQr: (qr: string) => void;
    emitPhoneNumber: (p: string) => void;
    emitOwnerLid: (lid: string) => void;
    connect: () => Promise<void>;
    sentMessageIds: SentMessageTracker;
    emitMessage: (msg: unknown) => void;
  },
) {
  socket.ev.on('creds.update', saveCreds);
  socket.ev.on(
    'connection.update',
    (update: { connection?: string; lastDisconnect?: { error?: unknown }; qr?: string }) =>
      handleConnectionUpdate(update, DisconnectReason, jidNormalizedUser, {
        reconnect: deps.reconnect,
        authStatePath: deps.authStatePath,
        disposed: deps.disposed,
        manualDisconnect: deps.manualDisconnect,
        socket,
        setStatus: deps.setStatus,
        setQrCode: deps.setQrCode,
        emitQr: deps.emitQr,
        emitPhoneNumber: deps.emitPhoneNumber,
        emitOwnerLid: deps.emitOwnerLid,
        reconnect_connect: () => {
          deps.connect().catch((e) => log.error('[WhatsApp] Reconnect failed:', e));
        },
      }),
  );
  socket.ev.on('messages.upsert', (upsert: { type: string; messages: unknown[] }) => {
    for (const raw of upsert.messages as Array<Record<string, unknown>>) {
      const key = raw.key as Record<string, unknown> | undefined;
      const msgId = key?.id as string | undefined;
      if (msgId && deps.sentMessageIds.has(msgId)) {
        deps.sentMessageIds.remove(msgId);
        continue;
      }
      const msg = normalizeMessage(raw);
      if (msg) deps.emitMessage(msg);
    }
  });
}
