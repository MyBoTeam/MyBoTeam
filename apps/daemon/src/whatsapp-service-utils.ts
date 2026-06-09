import type { MessagingConnectionStatus } from '@myboteam/agent-core/common';

export interface WhatsAppDaemonConfig {
  providerId: 'whatsapp';
  enabled: boolean;
  status: MessagingConnectionStatus;
  phoneNumber?: string;
  lastConnectedAt?: number;
  qrCode?: string;
  qrIssuedAt?: number;
  syncState?: 'idle' | 'syncing' | 'complete';
  syncProgress?: {
    chatsProcessed: number;
    messagesProcessed: number;
    totalChats?: number;
    totalMessages?: number;
  };
}
