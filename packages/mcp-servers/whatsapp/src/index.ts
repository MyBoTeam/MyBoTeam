#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { downloadMediaTool, downloadMediaToolHandler } from './tools/download-media.js';
import { getGroupInfoTool, getGroupInfoToolHandler } from './tools/get-group-info.js';
import { getMessagesTool, getMessagesToolHandler } from './tools/get-messages.js';
import { getStatusTool, getStatusToolHandler } from './tools/get-status.js';
import { listChatsTool, listChatsToolHandler } from './tools/list-chats.js';
import { listGroupsTool, listGroupsToolHandler } from './tools/list-groups.js';
import { logoutTool, logoutToolHandler } from './tools/logout.js';
import { markReadTool, markReadToolHandler } from './tools/mark-read.js';
import { sendTool, sendToolHandler } from './tools/send.js';
import { sendPollTool, sendPollToolHandler } from './tools/send-poll.js';
import { sendReactionTool, sendReactionToolHandler } from './tools/send-reaction.js';
import { sendTypingTool, sendTypingToolHandler } from './tools/send-typing.js';

if (!process.env.MYBOTEAM_WHATSAPP_API_PORT) {
  process.stderr.write('MYBOTEAM_WHATSAPP_API_PORT is not set — WhatsApp MCP tool cannot start\n');
  process.exit(1);
}

const TOOLS = [
  sendTool,
  sendReactionTool,
  sendPollTool,
  sendTypingTool,
  listChatsTool,
  getMessagesTool,
  listGroupsTool,
  getGroupInfoTool,
  downloadMediaTool,
  markReadTool,
  getStatusTool,
  logoutTool,
];

const HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<CallToolResult>> = {
  SendWhatsAppMessage: sendToolHandler,
  SendWhatsAppReaction: sendReactionToolHandler,
  SendWhatsAppPoll: sendPollToolHandler,
  SendWhatsAppTyping: sendTypingToolHandler,
  ListWhatsAppChats: listChatsToolHandler,
  GetWhatsAppMessages: getMessagesToolHandler,
  ListWhatsAppGroups: listGroupsToolHandler,
  GetWhatsAppGroupInfo: getGroupInfoToolHandler,
  DownloadWhatsAppMedia: downloadMediaToolHandler,
  MarkWhatsAppRead: markReadToolHandler,
  GetWhatsAppStatus: getStatusToolHandler,
  LogoutWhatsApp: logoutToolHandler,
};

const server = new Server(
  { name: '@myboteam/whatsapp-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name } = request.params;
  const handler = HANDLERS[name];
  if (!handler)
    return { content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }], isError: true };
  try {
    return await handler((request.params.arguments ?? {}) as Record<string, unknown>);
  } catch (error) {
    return {
      content: [
        { type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` },
      ],
      isError: true,
    };
  }
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
