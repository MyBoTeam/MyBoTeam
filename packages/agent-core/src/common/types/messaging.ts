export type MessagingPlatform = 'whatsapp' | 'slack' | 'telegram' | 'teams';

export type MessagingConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_ready'
  | 'connected'
  | 'error'
  | 'logged_out';

export type MessagingProviderId = MessagingPlatform;

export interface MessagingIntegrationConfig {
  platform: MessagingPlatform;

  enabled: boolean;

  tunnelEnabled: boolean;

  connectionStatus?: MessagingConnectionStatus;

  accountName?: string;

  phoneNumber?: string;

  lastConnectedAt?: number;

  lastProcessedAt?: number;

  lastProcessedMessageId?: string;
}

export interface MessagingConfig {
  integrations: Partial<Record<MessagingPlatform, MessagingIntegrationConfig>>;
}

export interface MessagingQRCode {
  platform: MessagingPlatform;

  qrData: string;

  expiresAt: number;
}

export interface IncomingMessage {
  platform: MessagingPlatform;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: number;
  messageId: string;

  chatId: string;
  isGroup?: boolean;
  isFromMe?: boolean;
}

export interface ChannelAdapter {
  readonly channelType: MessagingProviderId;
  getStatus(): MessagingConnectionStatus;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  dispose(): void;
}
