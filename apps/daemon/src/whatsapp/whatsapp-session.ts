import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import { log } from '../logger.js';
import { cleanupAuthState } from './authCleanup.js';
import type { BaileysSocket } from './baileys-types.js';
import { type ReconnectState, scheduleReconnect } from './reconnection.js';

interface WhatsAppServiceEvents {
  qr: (qrString: string) => void;
  status: (status: MessagingConnectionStatus) => void;
  message: (msg: {
    messageId: string;
    senderId: string;
    senderName?: string;
    text: string;
    timestamp: number;
    isGroup: boolean;
    isFromMe: boolean;
  }) => void;
  phoneNumber: (phoneNumber: string) => void;
  ownerLid: (lid: string) => void;
}

export interface ConnectionUpdateArgs {
  connection?: string;
  lastDisconnect?: { error?: unknown };
  qr?: string;
}

export interface SessionHandlerContext {
  reconnect: ReconnectState;
  authStatePath: string;
  disposed: boolean;
  manualDisconnect: boolean;

  socket: BaileysSocket | null;
  setStatus(s: MessagingConnectionStatus): void;
  setQrCode(qr: string | null): void;
  emitQr(qr: string): void;
  emitPhoneNumber(phoneNumber: string): void;
  emitOwnerLid(lid: string): void;
  reconnect_connect(): Promise<void> | void;
}

export function handleConnectionUpdate(
  update: ConnectionUpdateArgs,
  DisconnectReason: Record<string, number>,
  jidNormalizedUser: (jid: string) => string,
  ctx: SessionHandlerContext,
): void {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    ctx.setQrCode(qr);
    ctx.setStatus('qr_ready');
    ctx.emitQr(qr);
  }

  if (connection === 'close') {
    ctx.setQrCode(null);
    if (ctx.manualDisconnect) {
      ctx.setStatus('disconnected');
      return;
    }
    const code = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output
      ?.statusCode;
    if (code === DisconnectReason.loggedOut || code === DisconnectReason.forbidden) {
      ctx.setStatus('logged_out');
      cleanupAuthState(ctx.authStatePath);
    } else if (code === DisconnectReason.restartRequired || code === DisconnectReason.badSession) {
      if (code === DisconnectReason.badSession) {
        cleanupAuthState(ctx.authStatePath);
      }
      if (!ctx.disposed) {
        ctx.reconnect_connect();
      }
    } else if (code === DisconnectReason.connectionReplaced) {
      log.warn('[WhatsApp] Connection replaced');
      ctx.setStatus('disconnected');
    } else if (!ctx.disposed) {
      scheduleReconnect(
        ctx.reconnect,
        async () => {
          await ctx.reconnect_connect();
        },
        () => ctx.setStatus('disconnected'),
      );
    }
  }

  if (connection === 'open') {
    ctx.setQrCode(null);
    ctx.reconnect.attempts = 0;
    ctx.reconnect.scheduled = false;
    ctx.setStatus('connected');
    const user = ctx.socket?.user;
    if (user?.id) {
      ctx.emitPhoneNumber(user.id.split(':')[0].split('@')[0]);
    }
    if (user?.lid) {
      ctx.emitOwnerLid(jidNormalizedUser(user.lid));
    }
  }
}
