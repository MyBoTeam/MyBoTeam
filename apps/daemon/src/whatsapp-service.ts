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
    if (this.service) {
      this.disposeInternal();
    }

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
    if (waConfig?.enabled !== undefined) {
      bridge.setEnabled(waConfig.enabled);
    }

    service.on('qr', (qr: string) => this.emit('qr', qr));
    service.on('status', (status: MessagingConnectionStatus) => this.emit('status', status));

    await service.connect();
  }

  async disconnect(): Promise<void> {
    if (this.service) {
      await this.service.disconnect();
    }
    this.disposeInternal();

    const config = this.storage.getMessagingConfig();
    if (config?.integrations?.whatsapp) {
      this.storage.setMessagingConfig({
        integrations: {
          ...(config.integrations ?? {}),
          whatsapp: undefined,
        },
      });
    }
  }

  getConfig(): WhatsAppDaemonConfig | null {
    const config = this.storage.getMessagingConfig();
    const waConfig = config?.integrations?.whatsapp;
    const liveStatus = this.service?.getStatus();
    const status: MessagingConnectionStatus =
      liveStatus ?? (waConfig?.connectionStatus as MessagingConnectionStatus) ?? 'disconnected';

    if (!waConfig && !this.service) {
      return null;
    }

    const result: WhatsAppDaemonConfig = {
      providerId: 'whatsapp',
      enabled: this.service ? true : (waConfig?.enabled ?? false),
      status,
      phoneNumber: waConfig?.phoneNumber as string | undefined,
      lastConnectedAt: waConfig?.lastConnectedAt as number | undefined,
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

  async sendMessage(recipientId: string, text: string): Promise<void> {
    if (!this.service) {
      throw new Error('WhatsApp is not connected');
    }
    await this.service.sendMessage(recipientId, text);
  }

  readChats(limit: number): ChatSummary[] {
    if (!this.service) {
      return [];
    }
    return this.service.getChats(limit);
  }

  readMessages(jid: string, limit: number): MessageSummary[] {
    if (!this.service) {
      return [];
    }
    return this.service.getMessages(jid, limit);
  }

  markDisconnected(): void {
    this.service?.markDisconnected();
  }

  setEnabled(enabled: boolean): void {
    if (this.bridge) {
      this.bridge.setEnabled(enabled);
    }
    const config = this.storage.getMessagingConfig();
    if (config?.integrations?.whatsapp) {
      this.storage.setMessagingConfig({
        integrations: {
          ...(config.integrations ?? {}),
          whatsapp: {
            ...(config.integrations.whatsapp ?? {}),
            enabled,
          },
        },
      });
    }
  }

  autoConnectIfEnabled(): void {
    const config = this.storage.getMessagingConfig();
    const waConfig = config?.integrations?.whatsapp;
    if (!waConfig?.enabled) {
      return;
    }
    const wasConnected = waConfig.connectionStatus === 'connected' || waConfig.lastConnectedAt;
    if (!wasConnected) {
      return;
    }
    log.info('[WhatsApp] Auto-connecting (previously enabled)...');
    this.connect().catch((err) => {
      log.error('[WhatsApp] Auto-connect failed:', err);
    });
  }

  dispose(): void {
    this.disposeInternal();
    this.removeAllListeners();
  }

  private disposeInternal(): void {
    if (this.bridge) {
      this.bridge.dispose();
      this.bridge = null;
    }
    if (this.service) {
      this.service.dispose();
      this.service = null;
    }
  }
}
