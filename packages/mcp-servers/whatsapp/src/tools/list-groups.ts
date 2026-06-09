import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const listGroupsTool = {
  name: 'ListWhatsAppGroups',
  description: 'List WhatsApp groups',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Maximum number of groups to return' },
    },
    required: [],
  },
};

export async function listGroupsToolHandler(
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const result = await callApi('/groups', { limit: args.limit });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  const groups = result.groups ?? [];
  if (groups.length === 0) return { content: [{ type: 'text', text: 'No groups found' }] };

  const lines = groups.map((g) => {
    const name = g.name ?? '(no name)';
    return `Name: ${name} | JID: ${g.jid} | Participants: ${g.participants}`;
  });
  return { content: [{ type: 'text', text: lines.join('\n') }] };
}
