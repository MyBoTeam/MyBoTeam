import type { PiAssistantMessage, PiToolCall } from '../../src/events/pi-event-types.js';

export function toolCallFixture(overrides: Partial<PiToolCall> = {}): PiToolCall {
  return {
    type: 'toolCall',
    id: 'call-1',
    name: 'tool',
    arguments: {},
    ...overrides,
  };
}

export function assistantMessageFixture(
  overrides: Partial<PiAssistantMessage> = {},
): PiAssistantMessage {
  return {
    role: 'assistant',
    content: [{ type: 'text', text: '' }],
    model: 'gpt-5',
    usage: {
      input: 10,
      output: 5,
      cacheRead: 1,
      cacheWrite: 2,
      totalTokens: 18,
      cost: {
        input: 0.01,
        output: 0.02,
        cacheRead: 0.001,
        cacheWrite: 0.002,
        total: 0.033,
      },
    },
    stopReason: 'stop',
    timestamp: 1_700_000_000_000,
    ...overrides,
  };
}
