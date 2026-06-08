import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const sendReactionTool = {
  name: 'SendWhatsAppReaction',
  description: 'Send an emoji reaction to a specific message via WhatsApp',
  inputSchema: {
    type: 'object',
    properties: {
      chatJid: { type: 'string', description: 'Chat JID of the conversation' },
      messageId: { type: 'string', description: 'ID of the message to react to' },
      emoji: { type: 'string', description: 'Emoji to send as reaction' },
    },
    required: ['chatJid', 'messageId', 'emoji'],
  },
};

export async function sendReactionToolHandler(
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const chatJid = args.chatJid;
  const messageId = args.messageId;
  const emoji = args.emoji;
  if (!chatJid)
    return { content: [{ type: 'text', text: 'Error: chatJid is required' }], isError: true };
  if (!messageId)
    return { content: [{ type: 'text', text: 'Error: messageId is required' }], isError: true };
  if (!emoji)
    return { content: [{ type: 'text', text: 'Error: emoji is required' }], isError: true };

  const result = await callApi('/send-reaction', { chatJid, messageId, emoji });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };
  return { content: [{ type: 'text', text: 'Reaction sent successfully' }] };
}
