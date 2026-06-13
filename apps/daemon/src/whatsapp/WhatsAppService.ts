import type {
  ChannelAdapter,
  MessagingConnectionStatus,
  MessagingProviderId,
} from '@myboteam/agent-core/common';
import { EventEmitter } from 'events';
import path from 'path';
import { downloadMedia as downloadMediaHelper } from './downloadMedia.js';
import { createReconnectState } from './reconnection.js';
import {
  markMessagesRead,
  type SendMessageOptions,
  sendPoll,
  sendReaction,
  sendText,
  sendTyping,
} from './send.js';
import {
  type LifecycleState,
  lifecycleConnect,
  lifecycleDisconnect,
  lifecycleDispose,
  lifecycleSoftResync,
  requireSocket,
} from './service-lifecycle.js';
import { lifecycleReconnect } from './service-reconnect.js';
import { getChats, getGroupInfo, getGroups, getMessages } from './service-store.js';
import type { ChatSummary, MessageSummary } from './whatsapp-types.js';
import { SentMessageTracker } from './whatsapp-types.js';

export type { BaileysSocket } from './baileys-types.js';
export type { ChatSummary, MessageSummary } from './whatsapp-types.js';

export class WhatsAppService extends EventEmitter implements ChannelAdapter {
  readonly channelType: MessagingProviderId = 'whatsapp';
  private l: LifecycleState;

  constructor(dataDir: string) {
    super();
    this.l = {
      socket: null,
      store: null,
      status: 'disconnected',
      reconnect: createReconnectState(),
      disposed: false,
      manualDisconnect: false,
      qrCode: null,
      qrIssuedAt: null,
      sentMessageIds: new SentMessageTracker(),
      phoneNumber: null,
      authStatePath: path.join(dataDir, 'whatsapp-auth'),
      storePath: path.join(dataDir, 'whatsapp-store.json'),
      lastTransportActivity: Date.now(),
      watchdogTimer: null,
      syncState: 'idle',
      syncProgress: { chatsProcessed: 0, messagesProcessed: 0 },
      syncListeners: null,
    };
  }

  getStatus(): MessagingConnectionStatus {
    return this.l.status;
  }
  getQrCode(): string | null {
    return this.l.qrCode;
  }
  getQrIssuedAt(): number | null {
    return this.l.qrIssuedAt;
  }
  getPhoneNumber(): string | null {
    return this.l.phoneNumber;
  }
  getSyncState(): 'idle' | 'syncing' | 'complete' {
    return this.l.syncState;
  }
  getSyncProgress(): {
    chatsProcessed: number;
    messagesProcessed: number;
    totalChats?: number;
    totalMessages?: number;
  } {
    return { ...this.l.syncProgress };
  }
  markDisconnected(): void {
    this.setStatus('disconnected');
  }
  private setStatus(s: MessagingConnectionStatus): void {
    this.l.status = s;
    this.emit('status', s);
  }

  async connect(): Promise<void> {
    return lifecycleConnect(
      this.l,
      (s) => this.setStatus(s),
      (e, ...a) => this.emit(e, ...a),
    );
  }

  async sendMessage(
    recipient: string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<string> {
    return sendText(requireSocket(this.l), recipient, text, options);
  }
  async sendReaction(
    chatJid: string,
    messageId: string,
    emoji: string,
    fromMe?: boolean,
    participant?: string,
  ): Promise<void> {
    return sendReaction(requireSocket(this.l), chatJid, messageId, emoji, fromMe, participant);
  }
  async sendPoll(
    recipient: string,
    question: string,
    options: string[],
    maxSelections?: number,
  ): Promise<string> {
    return sendPoll(requireSocket(this.l), recipient, question, options, maxSelections);
  }
  async sendTyping(
    recipient: string,
    action?: 'composing' | 'paused' | 'recording',
  ): Promise<void> {
    return sendTyping(requireSocket(this.l), recipient, action);
  }
  async markRead(chatJid: string, messageIds: string[]): Promise<void> {
    return markMessagesRead(requireSocket(this.l), chatJid, messageIds);
  }

  async downloadMedia(
    chatJid: string,
    messageId: string,
  ): Promise<{ filePath: string; mimeType: string } | null> {
    if (!this.l.store) return null;
    return downloadMediaHelper(this.l.store, this.l.storePath, chatJid, messageId);
  }
  getGroups(limit: number): Array<{ jid: string; name?: string; participants: number | null }> {
    return getGroups(this.l.store, limit);
  }
  getGroupInfo(groupJid: string): { jid: string; name?: string } | null {
    return getGroupInfo(this.l.store, groupJid);
  }
  getChats(limit: number): ChatSummary[] {
    return getChats(this.l.store, limit);
  }
  getMessages(jid: string, limit: number): MessageSummary[] {
    return getMessages(this.l.store, jid, limit);
  }

  async disconnect(): Promise<void> {
    await lifecycleDisconnect(this.l, (s) => this.setStatus(s));
  }
  async reconnect(): Promise<void> {
    await lifecycleReconnect(
      this.l,
      (s) => this.setStatus(s),
      (e, ...a) => this.emit(e, ...a),
    );
  }
  async resync(): Promise<void> {
    if (!this.l.socket || !this.l.store) {
      await this.reconnect();
      return;
    }
    lifecycleSoftResync(this.l, (e, ...a) => this.emit(e, ...a));
  }
  dispose(): void {
    lifecycleDispose(this.l);
    this.removeAllListeners();
  }
}
