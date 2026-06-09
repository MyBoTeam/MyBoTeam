import { EventEmitter } from 'node:events';
import type { StorageAPI } from '@myboteam/agent-core';
import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';
import { log } from './logger.js';
import type { TaskService } from './task-service.js';
import {
  type TaskBridge,
  WhatsAppService,
  wireStatusListeners,
  wireTaskBridge,
} from './whatsapp/index.js';
import type { SendMessageOptions } from './whatsapp/send.js';
import type { ChatSummary, MessageSummary } from './whatsapp/WhatsAppService.js';
import type { WhatsAppDaemonConfig } from './whatsapp-service-utils.js';
export class WhatsAppDaemonService extends EventEmitter {
  private storage: StorageAPI;
  private dataDir: string;
  private taskService: TaskService;
  private service: WhatsAppService | null = null;
  private bridge: TaskBridge | null = null;
  constructor(storage: StorageAPI, dataDir: string, taskService: TaskService) {
    super();
    this.storage = storage;
    this.dataDir = dataDir;
    this.taskService = taskService;
  }
  async connect(): Promise<void> {
    if (this.service) this.disposeInternal();
    const service = new WhatsAppService(this.dataDir);
    this.service = service;
    const { bridge } = wireTaskBridge(service, this.taskService, this.storage);
    this.bridge = bridge;
    const config0 = this.storage.getMessagingConfig();
    const wa0 = config0?.integrations?.whatsapp;
    if (!wa0?.lastProcessedAt) {
      const initialWatermark = (wa0?.lastConnectedAt as number) ?? Date.now();
      this.storage.setMessagingConfig({
        integrations: {
          ...(config0?.integrations ?? {}),
          whatsapp: {
            ...(wa0 ?? { platform: 'whatsapp', enabled: true, tunnelEnabled: false }),
            lastProcessedAt: initialWatermark,
          },
        },
      });
    }
    wireStatusListeners(service, this.storage, bridge);
    const config = this.storage.getMessagingConfig();
    const waConfig = config?.integrations?.whatsapp;
    if (waConfig?.enabled !== undefined) bridge.setEnabled(waConfig.enabled);
    service.on('qr', (qr: string) => this.emit('qr', qr));
    service.on('status', (status: MessagingConnectionStatus) => this.emit('status', status));
    service.on('syncProgress', (data) => this.emit('syncProgress', data));
    await service.connect();
  }
  async disconnect(): Promise<void> {
    if (this.service) await this.service.disconnect();
    this.disposeInternal();
    const config = this.storage.getMessagingConfig();
    if (config?.integrations?.whatsapp) {
      this.storage.setMessagingConfig({
        integrations: { ...(config.integrations ?? {}), whatsapp: undefined },
      });
    }
  }
  getConfig(): WhatsAppDaemonConfig | null {
    const config = this.storage.getMessagingConfig();
    const waConfig = config?.integrations?.whatsapp;
    const liveStatus = this.service?.getStatus();
    const status: MessagingConnectionStatus =
      liveStatus ?? (waConfig?.connectionStatus as MessagingConnectionStatus) ?? 'disconnected';
    if (!waConfig && !this.service) return null;
    const syncState = this.service?.getSyncState() ?? 'idle';
    const syncProgress = this.service?.getSyncProgress() ?? {
      chatsProcessed: 0,
      messagesProcessed: 0,
    };
    const result: WhatsAppDaemonConfig = {
      providerId: 'whatsapp',
      enabled: this.service ? true : (waConfig?.enabled ?? false),
      status,
      phoneNumber: waConfig?.phoneNumber as string | undefined,
      lastConnectedAt: waConfig?.lastConnectedAt as number | undefined,
      syncState,
      syncProgress,
    };
    if (status === 'qr_ready' && this.service) {
      const qrCode = this.service.getQrCode();
      const qrIssuedAt = this.service.getQrIssuedAt();
      if (qrCode && qrIssuedAt) {
        result.qrCode = qrCode;
        result.qrIssuedAt = qrIssuedAt;
      }
    }
    return result;
  }
  async sendMessage(
    recipientId: string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<string> {
    if (!this.service) throw new Error('WhatsApp is not connected');
    return this.service.sendMessage(recipientId, text, options);
  }
  readChats(limit: number): ChatSummary[] {
    if (!this.service) return [];
    return this.service.getChats(limit);
  }
  readMessages(jid: string, limit: number): MessageSummary[] {
    if (!this.service) return [];
    return this.service.getMessages(jid, limit);
  }
  async sendReaction(
    chatJid: string,
    messageId: string,
    emoji: string,
    fromMe?: boolean,
    participant?: string,
  ): Promise<void> {
    if (!this.service) throw new Error('WhatsApp is not connected');
    return this.service.sendReaction(chatJid, messageId, emoji, fromMe, participant);
  }
  async sendPoll(
    recipient: string,
    question: string,
    options: string[],
    maxSelections?: number,
  ): Promise<string> {
    if (!this.service) throw new Error('WhatsApp is not connected');
    return this.service.sendPoll(recipient, question, options, maxSelections);
  }
  async sendTyping(
    recipient: string,
    action?: 'composing' | 'paused' | 'recording',
  ): Promise<void> {
    if (!this.service) throw new Error('WhatsApp is not connected');
    return this.service.sendTyping(recipient, action);
  }
  async markRead(chatJid: string, messageIds: string[]): Promise<void> {
    if (!this.service) throw new Error('WhatsApp is not connected');
    return this.service.markRead(chatJid, messageIds);
  }
  async downloadMedia(
    chatJid: string,
    messageId: string,
  ): Promise<{ filePath: string; mimeType: string } | null> {
    if (!this.service) return null;
    return this.service.downloadMedia(chatJid, messageId);
  }
  readGroups(limit: number): Array<{ jid: string; name?: string; participants: number }> {
    if (!this.service) return [];
    return this.service.getGroups(limit);
  }
  readGroupInfo(groupJid: string): { jid: string; name?: string } | null {
    if (!this.service) return null;
    return this.service.getGroupInfo(groupJid);
  }
  markDisconnected(): void {
    this.service?.markDisconnected();
  }
  setEnabled(enabled: boolean): void {
    this.bridge?.setEnabled(enabled);
    const config = this.storage.getMessagingConfig();
    if (config?.integrations?.whatsapp) {
      this.storage.setMessagingConfig({
        integrations: {
          ...(config.integrations ?? {}),
          whatsapp: { ...(config.integrations.whatsapp ?? {}), enabled },
        },
      });
    }
  }
  async resync(): Promise<void> {
    if (this.service) {
      await this.service.resync();
    } else {
      await this.connect();
    }
  }
  autoConnectIfEnabled(): void {
    const config = this.storage.getMessagingConfig();
    const waConfig = config?.integrations?.whatsapp;
    if (!waConfig?.enabled) return;
    if (!(waConfig.connectionStatus === 'connected' || waConfig.lastConnectedAt)) return;
    log.info('[WhatsApp] Auto-connecting (previously enabled)...');
    this.connect().catch((err) => log.error('[WhatsApp] Auto-connect failed:', err));
  }
  dispose(): void {
    this.disposeInternal();
    this.removeAllListeners();
  }
  private disposeInternal(): void {
    this.bridge?.dispose();
    this.bridge = null;
    this.service?.dispose();
    this.service = null;
  }
}
