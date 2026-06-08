export interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  messageId?: string;
  chats?: Array<{ jid: string; name?: string; lastMessageAt?: number }>;
  messages?: Array<{
    messageId?: string;
    senderJid: string;
    fromMe: boolean;
    text: string;
    timestamp: number;
  }>;
  groups?: Array<{ jid: string; name?: string; participants: number }>;
  group?: {
    jid: string;
    name?: string;
    participants?: Array<{ id: string; admin?: string }>;
  } | null;
  filePath?: string;
  mimeType?: string;
  connected?: boolean;
  status?: string;
  phoneNumber?: string | null;
}
