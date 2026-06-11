import { describe, expect, it } from 'vitest';
import { mapPiAssistantEvent } from '../../src/events/pi-event-mapper.js';
import { assistantMessageFixture } from './pi-fixtures.js';

describe('Pi text and thinking event mapping', () => {
  it('maps text deltas to neutral message events', () => {
    const events = mapPiAssistantEvent(
      {
        type: 'text_delta',
        contentIndex: 0,
        delta: 'hello',
        partial: assistantMessageFixture({ content: [{ type: 'text', text: 'hello' }] }),
      },
      { messageId: 'msg-1', sessionId: 'sess-1' },
    );

    expect(events).toEqual([
      {
        event: 'message',
        args: [
          {
            type: 'text',
            timestamp: 1_700_000_000_000,
            sessionID: 'sess-1',
            part: {
              id: 'msg-1-text',
              sessionID: 'sess-1',
              messageID: 'msg-1',
              type: 'text',
              text: 'hello',
            },
          },
        ],
      },
    ]);
  });

  it('maps thinking deltas to reasoning events', () => {
    const events = mapPiAssistantEvent(
      {
        type: 'thinking_delta',
        contentIndex: 0,
        delta: 'checking plan',
        partial: assistantMessageFixture({
          content: [{ type: 'thinking', thinking: 'checking plan' }],
        }),
      },
      { messageId: 'msg-2', sessionId: 'sess-2' },
    );

    expect(events).toEqual([{ event: 'reasoning', args: ['checking plan'] }]);
  });
});
