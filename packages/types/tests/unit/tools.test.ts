import { describe, expect, it } from 'vitest';
import { ToolCallSchema, ToolDefinitionSchema } from '../../src/tools.js';

describe('ToolDefinitionSchema', () => {
  it('accepts valid tool definition', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'search',
      description: 'Search the web',
      parameters: {
        query: { type: 'string', required: true },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts tool with no parameters', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'get_time',
      description: 'Get current time',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: '',
      description: 'Search the web',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'search',
      description: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('ToolCallSchema', () => {
  it('accepts valid tool call', () => {
    const result = ToolCallSchema.safeParse({
      id: 'tc_123',
      name: 'search',
      arguments: { query: 'test' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = ToolCallSchema.safeParse({
      id: '',
      name: 'search',
      arguments: { query: 'test' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = ToolCallSchema.safeParse({
      id: 'tc_123',
      name: '',
      arguments: { query: 'test' },
    });
    expect(result.success).toBe(false);
  });
});
