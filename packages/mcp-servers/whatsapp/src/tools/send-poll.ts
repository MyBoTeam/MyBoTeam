import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { callApi } from '../api-client.js';

export const sendPollTool = {
  name: 'SendWhatsAppPoll',
  description: 'Send a poll with multiple options via WhatsApp',
  inputSchema: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Recipient JID' },
      question: { type: 'string', description: 'Poll question' },
      options: { type: 'array', items: { type: 'string' }, description: 'Poll answer options' },
    },
    required: ['recipient', 'question', 'options'],
  },
};

export async function sendPollToolHandler(args: Record<string, unknown>): Promise<CallToolResult> {
  const recipient = args.recipient;
  const question = args.question;
  const options = args.options;
  if (!recipient)
    return { content: [{ type: 'text', text: 'Error: recipient is required' }], isError: true };
  if (!question)
    return { content: [{ type: 'text', text: 'Error: question is required' }], isError: true };
  if (!Array.isArray(options) || options.length === 0)
    return {
      content: [{ type: 'text', text: 'Error: options must be a non-empty array' }],
      isError: true,
    };
  if (!options.every((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0))
    return {
      content: [{ type: 'text', text: 'Error: all poll options must be non-empty strings' }],
      isError: true,
    };

  const result = await callApi('/send-poll', { recipient, question, options });
  if (!result.success)
    return { content: [{ type: 'text', text: result.error ?? 'Unknown error' }], isError: true };
  return { content: [{ type: 'text', text: `Poll sent successfully. ID: ${result.messageId}` }] };
}
