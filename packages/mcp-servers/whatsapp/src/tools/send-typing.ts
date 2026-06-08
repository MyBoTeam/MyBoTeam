import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const sendTypingTool = {
  name: 'SendWhatsAppTyping',
  description: 'Send a typing indicator or presence update via WhatsApp',
  inputSchema: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Recipient JID' },
      action: {
        type: 'string',
        enum: ['composing', 'paused', 'recording'],
        description: 'Typing action (default: composing)',
      },
    },
    required: ['recipient'],
  },
};

export async function sendTypingToolHandler(
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const recipient = args.recipient;
  if (!recipient)
    return { content: [{ type: 'text', text: 'Error: recipient is required' }], isError: true };

  const result = await callApi('/send-typing', { recipient, action: args.action ?? 'composing' });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };
  return {
    content: [{ type: 'text', text: `Typing indicator sent (${args.action ?? 'composing'})` }],
  };
}
