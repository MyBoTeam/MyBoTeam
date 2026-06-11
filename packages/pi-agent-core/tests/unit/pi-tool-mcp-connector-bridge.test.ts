import { describe, expect, it, vi } from 'vitest';
import { createPiCapabilityBridge, executePiCapability } from '../../src/tools/pi-tool-bridge.js';

describe('Pi tool/MCP/connector bridge contracts', () => {
  it.each([
    'tool',
    'mcp',
    'connector',
  ] as const)('wraps available %s capabilities', async (kind) => {
    const handler = vi.fn(async (input: unknown) => ({ echoed: input }));
    const entry = createPiCapabilityBridge({
      kind,
      name: `${kind}-capability`,
      description: 'Capability description',
      enabled: true,
      handler,
    });

    expect(entry).toMatchObject({
      status: 'available',
      kind,
      name: `${kind}-capability`,
      description: 'Capability description',
    });
    await expect(executePiCapability(entry, { value: 1 })).resolves.toEqual({
      ok: true,
      value: { echoed: { value: 1 } },
    });
  });

  it('records unavailable capabilities as approved exclusions', async () => {
    const entry = createPiCapabilityBridge({
      kind: 'connector',
      name: 'slack',
      description: 'Slack connector',
      enabled: false,
    });

    expect(entry).toEqual({
      status: 'approved-exclusion',
      kind: 'connector',
      name: 'slack',
      reason: 'connector capability slack is not available to Pi yet',
    });
    await expect(executePiCapability(entry, {})).resolves.toEqual({
      ok: false,
      error: 'connector capability slack is not available to Pi yet',
    });
  });
});
