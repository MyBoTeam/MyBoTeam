import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const sendTool = {
  name: 'SendWhatsAppMessage',
  description: 'Send a text message with optional media attachment via WhatsApp',
  inputSchema: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Recipient JID (phone number or group ID)' },
      message: { type: 'string', description: 'Text message content' },
      mediaPath: { type: 'string', description: 'Local file path for media attachment' },
      mediaType: {
        type: 'string',
        enum: ['image', 'audio', 'video', 'document'],
        description: 'Media type',
      },
    },
    required: ['recipient', 'message'],
  },
};

export async function sendToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const recipient = args.recipient;
  const message = args.message;
  if (!recipient)
    return { content: [{ type: 'text', text: 'Error: recipient is required' }], isError: true };
  if (!message)
    return { content: [{ type: 'text', text: 'Error: message is required' }], isError: true };

  const result = await callApi('/send', {
    recipient,
    message,
    ...(args.mediaPath ? { mediaPath: args.mediaPath } : {}),
    ...(args.mediaType ? { mediaType: args.mediaType } : {}),
  });

  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };
  return {
    content: [{ type: 'text', text: `Message sent successfully. ID: ${result.messageId}` }],
  };
}
