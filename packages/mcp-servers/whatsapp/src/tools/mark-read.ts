import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const markReadTool = {
  name: 'MarkWhatsAppRead',
  description: 'Mark messages as read in a WhatsApp chat',
  inputSchema: {
    type: 'object',
    properties: {
      chatJid: { type: 'string', description: 'Chat JID' },
      messageIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of message IDs to mark as read',
      },
    },
    required: ['chatJid', 'messageIds'],
  },
};

export async function markReadToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const chatJid = args.chatJid;
  const messageIds = args.messageIds;
  if (!chatJid)
    return { content: [{ type: 'text', text: 'Error: chatJid is required' }], isError: true };
  if (!Array.isArray(messageIds) || messageIds.length === 0)
    return {
      content: [{ type: 'text', text: 'Error: messageIds must be a non-empty array' }],
      isError: true,
    };

  const result = await callApi('/mark-read', { chatJid, messageIds });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  return {
    content: [
      { type: 'text', text: `Marked ${messageIds.length} message(s) as read in ${chatJid}` },
    ],
  };
}
