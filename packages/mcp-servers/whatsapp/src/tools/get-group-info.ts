import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const getGroupInfoTool = {
  name: 'GetWhatsAppGroupInfo',
  description: 'Get detailed information about a WhatsApp group',
  inputSchema: {
    type: 'object',
    properties: {
      groupJid: { type: 'string', description: 'Group JID' },
    },
    required: ['groupJid'],
  },
};

export async function getGroupInfoToolHandler(
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const groupJid = args.groupJid;
  if (!groupJid)
    return { content: [{ type: 'text', text: 'Error: groupJid is required' }], isError: true };

  const result = await callApi('/group-info', { groupJid });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };

  const group = result.group;
  if (!group) return { content: [{ type: 'text', text: 'Group not found' }] };

  const name = group.name ?? '(no name)';
  const participants = group.participants ?? [];
  const participantLines = participants
    .map((p) => `  - ID: ${p.id}${p.admin ? ` (${p.admin})` : ''}`)
    .join('\n');
  const text = `Name: ${name}\nJID: ${group.jid}\nParticipants (${participants.length}):\n${participantLines}`;
  return { content: [{ type: 'text', text }] };
}
