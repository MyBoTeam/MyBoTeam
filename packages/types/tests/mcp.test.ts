import { describe, expect, it } from 'vitest';
import { MCPConfigSchema, McpServerStatusSchema } from '../src/mcp.js';

describe('MCPConfigSchema', () => {
  const validConfig = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    env: { HOME: '/home/user' },
    status: 'running',
    pid: 12345,
    workspaceRoot: '/home/user',
    enabled: true,
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
  };

  it('accepts valid config', () => {
    const result = MCPConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('accepts minimal config', () => {
    const result = MCPConfigSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'filesystem',
      command: 'npx',
      createdAt: '2026-06-25T00:00:00Z',
      updatedAt: '2026-06-25T00:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.args).toEqual([]);
      expect(result.data.env).toEqual({});
      expect(result.data.status).toBe('stopped');
      expect(result.data.enabled).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = MCPConfigSchema.safeParse({
      ...validConfig,
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('McpServerStatusSchema', () => {
  it('accepts all valid statuses', () => {
    const statuses = ['stopped', 'starting', 'running', 'error'];
    statuses.forEach((status) => {
      expect(McpServerStatusSchema.safeParse(status).success).toBe(true);
    });
  });
});
