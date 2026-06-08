import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const getStatusTool = {
  name: 'GetWhatsAppStatus',
  description: 'Get WhatsApp connection status',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function getStatusToolHandler(
  _args: Record<string, unknown>,
): Promise<CallToolResult> {
  const result = await callApi('/status', {});
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  const phone = result.phoneNumber ?? 'unknown';
  const status = result.status ?? 'unknown';
  return {
    content: [
      { type: 'text', text: `Status: ${status}\nConnected: ${result.connected}\nPhone: ${phone}` },
    ],
  };
}
