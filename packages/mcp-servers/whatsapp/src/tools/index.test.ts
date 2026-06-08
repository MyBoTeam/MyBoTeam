import { describe, expect, it } from 'vitest';
import { downloadMediaTool } from './download-media.js';
import { getGroupInfoTool } from './get-group-info.js';
import { getMessagesTool } from './get-messages.js';
import { getStatusTool } from './get-status.js';
import { listChatsTool } from './list-chats.js';
import { listGroupsTool } from './list-groups.js';
import { logoutTool } from './logout.js';
import { markReadTool } from './mark-read.js';
import { sendTool } from './send.js';
import { sendPollTool } from './send-poll.js';
import { sendReactionTool } from './send-reaction.js';
import { sendTypingTool } from './send-typing.js';

describe('Tool Definitions', () => {
  const tools = [
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

  it('all 12 tools have name and description', () => {
    expect(tools).toHaveLength(12);
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
    }
  });

  it('all tool names are unique', () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all tool names start with action-oriented prefix', () => {
    for (const tool of tools) {
      expect(tool.name).toMatch(/^(Send|List|Get|Download|Mark|Logout)/);
    }
  });
});
