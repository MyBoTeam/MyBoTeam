import { describe, expect, it } from 'vitest';
import { DaemonEventSchema, DaemonEventTypeSchema } from '../src/daemon.js';

describe('DaemonEventSchema', () => {
  const validEvent = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'agent.started',
    source: 'daemon',
    payload: { agentId: '550e8400-e29b-41d4-a716-446655440001' },
    timestamp: '2026-06-25T00:00:00Z',
  };

  it('accepts valid event', () => {
    const result = DaemonEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('accepts event without payload', () => {
    const result = DaemonEventSchema.safeParse({
      ...validEvent,
      payload: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payload).toEqual({});
    }
  });

  it('rejects invalid type', () => {
    const result = DaemonEventSchema.safeParse({
      ...validEvent,
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('DaemonEventTypeSchema', () => {
  it('accepts all valid event types', () => {
    const types = [
      'agent.started',
      'agent.stopped',
      'agent.error',
      'task.created',
      'task.updated',
      'task.completed',
      'task.failed',
      'mcp.started',
      'mcp.stopped',
      'mcp.error',
      'system.ready',
      'system.shutdown',
    ];
    types.forEach((type) => {
      expect(DaemonEventTypeSchema.safeParse(type).success).toBe(true);
    });
  });
});
