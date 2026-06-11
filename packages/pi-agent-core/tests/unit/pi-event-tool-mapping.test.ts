import { describe, expect, it } from 'vitest';
import { mapPiAssistantEvent, mapPiToolResult } from '../../src/events/pi-event-mapper.js';
import { assistantMessageFixture, toolCallFixture } from './pi-fixtures.js';

describe('Pi tool event mapping', () => {
  it('maps tool call starts to running tool events', () => {
    const toolCall = toolCallFixture({ name: 'read_file', arguments: { path: 'README.md' } });
    const events = mapPiAssistantEvent(
      {
        type: 'toolcall_start',
        contentIndex: 0,
        partial: assistantMessageFixture({ content: [toolCall] }),
      },
      { messageId: 'msg-tool', sessionId: 'sess-tool' },
    );

    expect(events).toEqual([
      {
        event: 'message',
        args: [
          {
            type: 'tool_use',
            timestamp: 1_700_000_000_000,
            sessionID: 'sess-tool',
            part: {
              id: 'call-1',
              sessionID: 'sess-tool',
              messageID: 'msg-tool',
              type: 'tool',
              callID: 'call-1',
              tool: 'read_file',
              state: {
                status: 'running',
                input: { path: 'README.md' },
              },
            },
          },
        ],
      },
      { event: 'tool-use', args: ['read_file', { path: 'README.md' }] },
    ]);
  });

  it('maps tool call completion and result events', () => {
    const toolCall = toolCallFixture({ name: 'shell', arguments: { command: 'pwd' } });
    const completed = mapPiAssistantEvent(
      {
        type: 'toolcall_end',
        contentIndex: 0,
        toolCall,
        partial: assistantMessageFixture({ content: [toolCall] }),
      },
      { messageId: 'msg-tool', sessionId: 'sess-tool' },
    );
    const result = mapPiToolResult('shell', { command: 'pwd' }, '/tmp/project', {
      sessionId: 'sess-tool',
    });

    expect(completed.at(0)).toMatchObject({
      event: 'message',
      args: [{ part: { state: { status: 'completed', input: { command: 'pwd' } } } }],
    });
    expect(result).toEqual([
      { event: 'tool-result', args: ['/tmp/project'] },
      {
        event: 'tool-call-complete',
        args: [
          {
            toolName: 'shell',
            toolInput: { command: 'pwd' },
            toolOutput: '/tmp/project',
            sessionId: 'sess-tool',
          },
        ],
      },
    ]);
  });
});
