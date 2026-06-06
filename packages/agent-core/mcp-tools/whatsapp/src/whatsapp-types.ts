export const WHATSAPP_API_PORT = process.env.MYBOTEAM_WHATSAPP_API_PORT;
export const WHATSAPP_API_BASE = WHATSAPP_API_PORT
  ? `http://localhost:${WHATSAPP_API_PORT}`
  : '';
export const AUTH_TOKEN = process.env.MYBOTEAM_DAEMON_AUTH_TOKEN;

export function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }
  return headers;
}

export interface SendWhatsAppMessageInput {
  recipient: string;
  message: string;
}

export interface ListWhatsAppChatsInput {
  limit?: number;
}

export interface GetWhatsAppMessagesInput {
  jid: string;
  limit?: number;
}

export interface WhatsAppApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  chats?: Array<{ jid: string; name?: string; lastMessageAt?: number }>;
  messages?: Array<{ senderJid: string; fromMe: boolean; text: string; timestamp: number }>;
}

export const WHATSAPP_TOOLS = [
  {
    name: 'SendWhatsAppMessage',
    description:
      'Send a WhatsApp message to a contact using the connected WhatsApp account. ' +
      'Only works when WhatsApp is connected in Settings → Integrations. ' +
      'Provide the recipient as a phone number in international format (e.g. +15551234567) ' +
      'or as the value the user provided.',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description:
            "The recipient's phone number in international format (e.g. +15551234567) " +
            'or the value the user provided.',
        },
        message: {
          type: 'string',
          description: 'The text message to send.',
        },
      },
      required: ['recipient', 'message'],
    },
  },
  {
    name: 'ListWhatsAppChats',
    description:
      'List recent WhatsApp conversations for the connected account. ' +
      'Returns contact JIDs, display names, and last activity timestamps. ' +
      'Use this to discover recent conversations before reading messages. ' +
      'Only works when WhatsApp is connected in Settings → Integrations.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of chats to return (default 20, max 100).',
        },
      },
      required: [],
    },
  },
  {
    name: 'GetWhatsAppMessages',
    description:
      'Get recent messages from a specific WhatsApp conversation. ' +
      'Provide the contact JID (e.g. 15551234567@s.whatsapp.net for a contact, ' +
      'or the group JID for a group). ' +
      'Only works when WhatsApp is connected in Settings → Integrations.',
    inputSchema: {
      type: 'object',
      properties: {
        jid: {
          type: 'string',
          description:
            'The WhatsApp JID of the conversation ' +
            '(e.g. 15551234567@s.whatsapp.net or groupid@g.us).',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return (default 20, max 100).',
        },
      },
      required: ['jid'],
    },
  },
];

export async function callApi(path: string, body: Record<string, unknown>): Promise<WhatsAppApiResponse> {
  const response = await fetch(`${WHATSAPP_API_BASE}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`WhatsApp API returned ${response.status}`);
  }
  return (await response.json()) as WhatsAppApiResponse;
}
