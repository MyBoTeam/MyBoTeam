import { describe, expect, it } from 'vitest';
import { ToolCallSchema, ToolDefinitionSchema, ToolParameterSchema } from '../../src/tools.js';

describe('ToolParameterSchema', () => {
  it('defaults required to false', () => {
    const result = ToolParameterSchema.safeParse({ type: 'string' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.required).toBe(false);
    }
  });

  it('accepts valid parameter with description', () => {
    const result = ToolParameterSchema.safeParse({
      type: 'string',
      description: 'The query to search for',
    });
    expect(result.success).toBe(true);
  });

  it('accepts parameter with enum', () => {
    const result = ToolParameterSchema.safeParse({
      type: 'string',
      enum: ['asc', 'desc'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = ToolParameterSchema.safeParse({ type: 'invalid' });
    expect(result.success).toBe(false);
  });
});

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

  it('accepts name at max length (64 chars)', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'a'.repeat(64),
      description: 'Valid description',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name exceeding max length (65 chars)', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'a'.repeat(65),
      description: 'Valid description',
    });
    expect(result.success).toBe(false);
  });

  it('accepts description at max length (1024 chars)', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'search',
      description: 'a'.repeat(1024),
    });
    expect(result.success).toBe(true);
  });

  it('rejects description exceeding max length (1025 chars)', () => {
    const result = ToolDefinitionSchema.safeParse({
      name: 'search',
      description: 'a'.repeat(1025),
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
