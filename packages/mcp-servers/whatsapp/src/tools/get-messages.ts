import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const getMessagesTool = {
  name: 'GetWhatsAppMessages',
  description: 'Get recent messages from a specific chat via WhatsApp',
  inputSchema: {
    type: 'object',
    properties: {
      jid: { type: 'string', description: 'Chat JID to fetch messages from' },
      limit: { type: 'number', description: 'Maximum number of messages to return' },
    },
    required: ['jid'],
  },
};

export async function getMessagesToolHandler(
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const jid = args.jid;
  if (!jid) return { content: [{ type: 'text', text: 'Error: jid is required' }], isError: true };

  const result = await callApi('/messages', { jid, limit: args.limit ?? undefined });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  const messages = result.messages ?? [];
  if (messages.length === 0) return { content: [{ type: 'text', text: 'No messages found' }] };

  const lines = messages.map((m) => {
    const ts = m.timestamp ? new Date(m.timestamp * 1000).toISOString() : 'unknown';
    const sender = m.fromMe ? 'me' : m.senderJid;
    return `[${ts}] ${sender}: ${m.text}`;
  });
  return { content: [{ type: 'text', text: lines.join('\n') }] };
}
