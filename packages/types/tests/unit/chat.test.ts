import { describe, expect, it } from 'vitest';
import { ChatMessageSchema, ChatRequestSchema, ChatResponseSchema } from '../../src/chat.js';

describe('ChatMessageSchema', () => {
  it('accepts valid user message', () => {
    const result = ChatMessageSchema.safeParse({
      role: 'user',
      content: 'Hello',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid assistant message', () => {
    const result = ChatMessageSchema.safeParse({
      role: 'assistant',
      content: 'Hi there!',
      timestamp: '2026-06-25T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = ChatMessageSchema.safeParse({
      role: 'user',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = ChatMessageSchema.safeParse({
      role: 'invalid',
      content: 'Hello',
    });
    expect(result.success).toBe(false);
  });
});

describe('ChatRequestSchema', () => {
  it('accepts valid request', () => {
    const result = ChatRequestSchema.safeParse({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(result.success).toBe(true);
  });

  it('applies default timeout', () => {
    const result = ChatRequestSchema.safeParse({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeout).toBe(120_000);
    }
  });

  it('accepts custom timeout', () => {
    const result = ChatRequestSchema.safeParse({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: 'Hi' }],
      timeout: 30_000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty messages', () => {
    const result = ChatRequestSchema.safeParse({
      model: 'claude-sonnet-4-20250514',
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty model', () => {
    const result = ChatRequestSchema.safeParse({
      model: '',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('ChatResponseSchema', () => {
  it('accepts valid response', () => {
    const result = ChatResponseSchema.safeParse({
      message: {
        role: 'assistant',
        content: 'Hello!',
        timestamp: '2026-06-25T00:00:00Z',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts response with tool calls', () => {
    const result = ChatResponseSchema.safeParse({
      message: {
        role: 'assistant',
        content: 'Let me search for that.',
        timestamp: '2026-06-25T00:00:00Z',
      },
      toolCalls: [
        {
          id: 'tc_123',
          name: 'search',
          arguments: { query: 'test' },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts response with usage', () => {
    const result = ChatResponseSchema.safeParse({
      message: {
        role: 'assistant',
        content: 'Hello!',
        timestamp: '2026-06-25T00:00:00Z',
      },
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
    });
    expect(result.success).toBe(true);
  });
});
