import type {
  ChannelAdapter,
  MessagingConnectionStatus,
  MessagingProviderId,
} from '@myboteam/agent-core/common';
import { EventEmitter } from 'events';
import path from 'path';
import { cleanupAuthState } from './authCleanup.js';
import type { BaileysChat, BaileysMessage, BaileysSocket, BaileysStore } from './baileys-types.js';
import { clearReconnectTimer, createReconnectState, type ReconnectState } from './reconnection.js';
import { initBaileysSocket, wireSocketEvents } from './whatsapp-service-init.js';
import {
  type ChatSummary,
  type MessageSummary,
  SentMessageTracker,
  toTimestamp,
} from './whatsapp-types.js';

export type { ChatSummary, MessageSummary, WhatsAppServiceEvents } from './whatsapp-types.js';

export class WhatsAppService extends EventEmitter implements ChannelAdapter {
  readonly channelType: MessagingProviderId = 'whatsapp';
  private socket: BaileysSocket | null = null;
  private store: BaileysStore | null = null;
  private status: MessagingConnectionStatus = 'disconnected';
  private reconnect: ReconnectState = createReconnectState();
  private authStatePath: string;
  private disposed = false;
  private manualDisconnect = false;
  private qrCode: string | null = null;
  private qrIssuedAt: number | null = null;
  private sentMessageIds = new SentMessageTracker();
  constructor(dataDir: string) {
    super();
    this.authStatePath = path.join(dataDir, 'whatsapp-auth');
  }
  getStatus(): MessagingConnectionStatus {
    return this.status;
  }
  markDisconnected(): void {
    this.setStatus('disconnected');
  }
  private setStatus(s: MessagingConnectionStatus): void {
    this.status = s;
    this.emit('status', s);
  }
  async connect(): Promise<void> {
    if (this.disposed) throw new Error('WhatsApp service has been disposed');
    clearReconnectTimer(this.reconnect);
    this.reconnect.scheduled = false;
    this.reconnect.attempts = 0;
    this.manualDisconnect = false;
    if (this.status === 'connecting') return;
    this.setStatus('connecting');
    try {
      const { socket, store, saveCreds, DisconnectReason, jidNormalizedUser } =
        await initBaileysSocket(
          this.authStatePath,
          () => this.disposed,
          () => this.setStatus('disconnected'),
        );
      if (this.disposed) {
        this.setStatus('disconnected');
        return;
      }
      this.disposeSocket();
      if (this.disposed) {
        socket.end(new Error('WhatsApp service disposed during connect'));
        return;
      }
      this.socket = socket as unknown as BaileysSocket;
      this.store = store;
      wireSocketEvents(
        socket as unknown as BaileysSocket,
        saveCreds,
        DisconnectReason as unknown as Record<string, number>,
        jidNormalizedUser,
        {
          reconnect: this.reconnect,
          authStatePath: this.authStatePath,
          disposed: this.disposed,
          manualDisconnect: this.manualDisconnect,
          setStatus: (s) => this.setStatus(s),
          setQrCode: (qr) => {
            this.qrCode = qr;
            this.qrIssuedAt = Date.now();
          },
          emitQr: (qr) => this.emit('qr', qr),
          emitPhoneNumber: (p) => this.emit('phoneNumber', p),
          emitOwnerLid: (lid) => this.emit('ownerLid', lid),
          connect: () => this.connect(),
          sentMessageIds: this.sentMessageIds,
          emitMessage: (msg) => this.emit('message', msg),
        },
      );
    } catch (err) {
      this.setStatus('disconnected');
      throw err;
    }
  }
  async sendMessage(recipientId: string, text: string): Promise<void> {
    if (!this.socket) throw new Error('WhatsApp is not connected');
    const result = await this.socket.sendMessage(recipientId, { text });
    const resultKey = (result as { key?: { id?: string } } | undefined)?.key;
    if (resultKey?.id) this.sentMessageIds.add(resultKey.id);
  }
  getQrCode(): string | null {
    return this.qrCode;
  }
  getQrIssuedAt(): number | null {
    return this.qrIssuedAt;
  }
  async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    this.reconnect.scheduled = false;
    this.reconnect.attempts = 0;
    clearReconnectTimer(this.reconnect);
    if (this.socket) {
      this.socket.ev.removeAllListeners('creds.update');
      this.socket.ev.removeAllListeners('connection.update');
      this.socket.ev.removeAllListeners('messages.upsert');
      await this.socket.logout().catch(() => {});
      this.socket.end(new Error('User requested disconnect'));
      this.socket = null;
    }
    this.qrCode = null;
    this.qrIssuedAt = null;
    this.store = null;
    cleanupAuthState(this.authStatePath);
    this.setStatus('disconnected');
  }
  dispose(): void {
    this.disposed = true;
    this.qrCode = null;
    this.qrIssuedAt = null;
    this.store = null;
    clearReconnectTimer(this.reconnect);
    this.removeAllListeners();
    if (this.socket) {
      this.socket.ev.removeAllListeners('creds.update');
      this.socket.ev.removeAllListeners('connection.update');
      this.socket.ev.removeAllListeners('messages.upsert');
      this.socket.end(new Error('Socket replaced'));
      this.socket = null;
    }
  }
  getChats(limit: number): ChatSummary[] {
    if (!this.store) return [];
    const chats: BaileysChat[] = this.store.chats.all() ?? [];
    return chats.slice(0, limit).map((c) => ({
      jid: c.id as string,
      name: c.name as string | undefined,
      lastMessageAt: toTimestamp(c.conversationTimestamp),
    }));
  }
  getMessages(jid: string, limit: number): MessageSummary[] {
    if (!this.store) return [];
    const msgs: BaileysMessage[] = this.store.messages[jid]?.all() ?? [];
    return msgs.slice(-limit).flatMap((m) => {
      const text: string | undefined =
        m.message?.conversation ?? m.message?.extendedTextMessage?.text;
      if (!text) return [];
      return [
        {
          senderJid: m.key?.fromMe ? 'me' : (m.key?.participant ?? m.key?.remoteJid ?? jid),
          fromMe: Boolean(m.key?.fromMe),
          text,
          timestamp: toTimestamp(m.messageTimestamp) ?? 0,
        },
      ];
    });
  }
  private disposeSocket(): void {
    if (!this.socket) return;
    this.socket.ev.removeAllListeners('creds.update');
    this.socket.ev.removeAllListeners('connection.update');
    this.socket.ev.removeAllListeners('messages.upsert');
    this.socket.end(new Error('Socket replaced'));
    this.socket = null;
  }
}
