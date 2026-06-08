import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const downloadMediaTool = {
  name: 'DownloadWhatsAppMedia',
  description: 'Download media from a WhatsApp message',
  inputSchema: {
    type: 'object',
    properties: {
      chatJid: { type: 'string', description: 'Chat JID containing the media message' },
      messageId: { type: 'string', description: 'Message ID of the media to download' },
    },
    required: ['chatJid', 'messageId'],
  },
};

export async function downloadMediaToolHandler(
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const chatJid = args.chatJid;
  const messageId = args.messageId;
  if (!chatJid)
    return { content: [{ type: 'text', text: 'Error: chatJid is required' }], isError: true };
  if (!messageId)
    return { content: [{ type: 'text', text: 'Error: messageId is required' }], isError: true };

  const result = await callApi('/download-media', { chatJid, messageId });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  return {
    content: [
      {
        type: 'text',
        text: `Media downloaded to: ${result.filePath}\nMIME type: ${result.mimeType}`,
      },
    ],
  };
}
