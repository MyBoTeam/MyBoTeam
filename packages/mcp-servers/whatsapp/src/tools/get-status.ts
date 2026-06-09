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

  const config = result.config;
  const status = config?.status ?? 'unknown';
  const connected = status === 'connected';
  const phone = config?.phoneNumber ?? 'unknown';
  return {
    content: [
      { type: 'text', text: `Status: ${status}\nConnected: ${connected}\nPhone: ${phone}` },
    ],
  };
}
