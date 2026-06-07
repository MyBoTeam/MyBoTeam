#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  callApi,
  type GetWhatsAppMessagesInput,
  type ListWhatsAppChatsInput,
  type SendWhatsAppMessageInput,
  WHATSAPP_API_PORT,
  WHATSAPP_TOOLS,
} from './whatsapp-types.js';

if (!WHATSAPP_API_PORT) {
  process.stderr.write('MYBOTEAM_WHATSAPP_API_PORT is not set — WhatsApp MCP tool cannot start\n');
  process.exit(1);
}

const server = new Server({ name: 'whatsapp', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: WHATSAPP_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name } = request.params;

  if (name === 'SendWhatsAppMessage') {
    const { recipient, message } = (request.params.arguments ??
      {}) as unknown as SendWhatsAppMessageInput;

    if (!recipient?.trim()) {
      return {
        content: [{ type: 'text', text: 'Error: A recipient is required.' }],
        isError: true,
      };
    }
    if (!message?.trim()) {
      return {
        content: [{ type: 'text', text: 'Error: A message body is required.' }],
        isError: true,
      };
    }

    try {
      const result = await callApi('/send', {
        recipient: recipient.trim(),
        message: message.trim(),
      });
      if (!result.success) {
        return {
          content: [{ type: 'text', text: result.message ?? 'Failed to send WhatsApp message.' }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: `Message sent to ${recipient.trim()}.` }] };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: Failed to reach WhatsApp API: ${msg}` }],
        isError: true,
      };
    }
  }

  if (name === 'ListWhatsAppChats') {
    const { limit } = (request.params.arguments ?? {}) as unknown as ListWhatsAppChatsInput;
    try {
      const result = await callApi('/chats', { limit: limit ?? 20 });
      if (!result.success) {
        return {
          content: [{ type: 'text', text: result.message ?? 'Failed to list WhatsApp chats.' }],
          isError: true,
        };
      }
      const chats = result.chats ?? [];
      if (chats.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No WhatsApp conversations found. The store may still be loading — try again in a moment.',
            },
          ],
        };
      }
      const lines = chats.map((c) => {
        const ts = c.lastMessageAt ? new Date(c.lastMessageAt * 1000).toISOString() : 'unknown';
        return `• ${c.name ?? c.jid} (${c.jid}) — last active: ${ts}`;
      });
      return {
        content: [{ type: 'text', text: `Recent WhatsApp conversations:\n${lines.join('\n')}` }],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: Failed to reach WhatsApp API: ${msg}` }],
        isError: true,
      };
    }
  }

  if (name === 'GetWhatsAppMessages') {
    const { jid, limit } = (request.params.arguments ?? {}) as unknown as GetWhatsAppMessagesInput;
    if (!jid?.trim()) {
      return { content: [{ type: 'text', text: 'Error: A jid is required.' }], isError: true };
    }
    try {
      const result = await callApi('/messages', { jid: jid.trim(), limit: limit ?? 20 });
      if (!result.success) {
        return {
          content: [{ type: 'text', text: result.message ?? 'Failed to get WhatsApp messages.' }],
          isError: true,
        };
      }
      const messages = result.messages ?? [];
      if (messages.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No messages found for this conversation. The store may still be loading — try again in a moment.',
            },
          ],
        };
      }
      const lines = messages.map((m) => {
        const ts = new Date(m.timestamp * 1000).toISOString();
        const sender = m.fromMe ? 'You' : m.senderJid;
        return `[${ts}] ${sender}: ${m.text}`;
      });
      return {
        content: [{ type: 'text', text: `Messages from ${jid.trim()}:\n${lines.join('\n')}` }],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: Failed to reach WhatsApp API: ${msg}` }],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WhatsApp MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
