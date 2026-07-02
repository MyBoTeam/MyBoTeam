import { describe, expect, it } from 'vitest';
import { FinishReasonSchema, StreamingChunkSchema } from '../../src/streaming.js';

describe('FinishReasonSchema', () => {
  it('accepts all valid reasons', () => {
    const reasons = ['stop', 'tool_call', 'length', 'error'];
    reasons.forEach((reason) => {
      expect(FinishReasonSchema.safeParse(reason).success).toBe(true);
    });
  });

  it('rejects invalid finishReason', () => {
    const result = FinishReasonSchema.safeParse('unknown');
    expect(result.success).toBe(false);
  });
});

describe('StreamingChunkSchema', () => {
  it('accepts content chunk', () => {
    const result = StreamingChunkSchema.safeParse({
      content: 'Hello',
    });
    expect(result.success).toBe(true);
  });

  it('accepts tool call chunk', () => {
    const result = StreamingChunkSchema.safeParse({
      toolCall: {
        id: 'tc_123',
        name: 'search',
        argumentsDelta: '{"query":',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts finish chunk', () => {
    const result = StreamingChunkSchema.safeParse({
      finishReason: 'stop',
      usage: {
        promptTokens: 10,
        completionTokens: 5,
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty chunk', () => {
    const result = StreamingChunkSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects negative promptTokens', () => {
    const result = StreamingChunkSchema.safeParse({
      usage: { promptTokens: -1, completionTokens: 5 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative completionTokens', () => {
    const result = StreamingChunkSchema.safeParse({
      usage: { promptTokens: 5, completionTokens: -1 },
    });
    expect(result.success).toBe(false);
  });
});
