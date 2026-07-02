import { describe, expect, it } from 'vitest';
import { ModelCapabilitiesSchema, ModelInfoSchema } from '../../src/models.js';

describe('ModelCapabilitiesSchema', () => {
  it('accepts valid capabilities', () => {
    const result = ModelCapabilitiesSchema.safeParse({
      tools: true,
      vision: false,
      streaming: true,
    });
    expect(result.success).toBe(true);
  });

  it('applies defaults', () => {
    const result = ModelCapabilitiesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tools).toBe(false);
      expect(result.data.vision).toBe(false);
      expect(result.data.streaming).toBe(true);
    }
  });
});

describe('ModelInfoSchema', () => {
  it('accepts valid model info', () => {
    const result = ModelInfoSchema.safeParse({
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      provider: 'anthropic',
      contextWindow: 200_000,
      capabilities: { tools: true, vision: true },
    });
    expect(result.success).toBe(true);
  });

  it('accepts model without contextWindow', () => {
    const result = ModelInfoSchema.safeParse({
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = ModelInfoSchema.safeParse({
      id: '',
      name: 'Claude',
      provider: 'anthropic',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative contextWindow', () => {
    const result = ModelInfoSchema.safeParse({
      id: 'claude',
      name: 'Claude',
      provider: 'anthropic',
      contextWindow: -1000,
    });
    expect(result.success).toBe(false);
  });
});
