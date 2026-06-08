import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const listChatsTool = {
  name: 'ListWhatsAppChats',
  description: 'List recent WhatsApp chats',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Maximum number of chats to return' },
    },
    required: [],
  },
};

export async function listChatsToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const result = await callApi('/chats', { limit: args.limit ?? undefined });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  const chats = result.chats ?? [];
  if (chats.length === 0) return { content: [{ type: 'text', text: 'No chats found' }] };

  const lines = chats.map((c) => {
    const jid = c.jid;
    const name = c.name ?? '(no name)';
    const last = c.lastMessageAt
      ? ` | last activity: ${new Date(c.lastMessageAt * 1000).toISOString()}`
      : '';
    return `JID: ${jid} | Name: ${name}${last}`;
  });
  return { content: [{ type: 'text', text: lines.join('\n') }] };
}
