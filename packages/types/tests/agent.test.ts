import { describe, expect, it } from 'vitest';
import { AgentConfigLegacySchema, AgentProcessSchema, AgentStatusSchema } from '../src/agent.js';

describe('AgentConfigLegacySchema', () => {
  const validAgent = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    slug: 'secretary',
    name: 'Secretary Agent',
    description: 'Handles administrative tasks',
    providerId: '550e8400-e29b-41d4-a716-446655440001',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are a helpful secretary',
    maxTokens: 4096,
    temperature: 0.7,
    mcpServerIds: ['550e8400-e29b-41d4-a716-446655440002'],
    enabled: true,
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
  };

  it('accepts valid agent config', () => {
    const result = AgentConfigLegacySchema.safeParse(validAgent);
    expect(result.success).toBe(true);
  });

  it('rejects invalid slug format', () => {
    const result = AgentConfigLegacySchema.safeParse({
      ...validAgent,
      slug: 'Invalid Slug!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = AgentConfigLegacySchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults', () => {
    const { mcpServerIds, enabled, ...minimalAgent } = validAgent;
    const result = AgentConfigLegacySchema.safeParse(minimalAgent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mcpServerIds).toEqual([]);
      expect(result.data.enabled).toBe(true);
    }
  });
});

describe('AgentProcessSchema', () => {
  const validProcess = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    agentId: '550e8400-e29b-41d4-a716-446655440001',
    status: 'running',
    startedAt: '2026-06-25T00:00:00Z',
    lastActivityAt: '2026-06-25T00:00:00Z',
    continuationCount: 0,
  };

  it('accepts valid process', () => {
    const result = AgentProcessSchema.safeParse(validProcess);
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = AgentProcessSchema.safeParse({
      ...validProcess,
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('AgentStatusSchema', () => {
  it('accepts all valid statuses', () => {
    const statuses = ['idle', 'materialized', 'starting', 'running', 'stopped', 'error'];
    statuses.forEach((status) => {
      expect(AgentStatusSchema.safeParse(status).success).toBe(true);
    });
  });
});
