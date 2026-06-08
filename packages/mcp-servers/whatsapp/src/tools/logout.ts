import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const logoutTool = {
  name: 'LogoutWhatsApp',
  description: 'Disconnect and logout from WhatsApp',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export async function logoutToolHandler(_args: Record<string, unknown>): Promise<CallToolResult> {
  const result = await callApi('/logout', {});
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  return { content: [{ type: 'text', text: 'Logged out from WhatsApp successfully' }] };
}
