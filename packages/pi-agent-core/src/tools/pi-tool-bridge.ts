export type PiCapabilityKind = 'tool' | 'mcp' | 'connector';

export interface PiCapabilityInput {
  kind: PiCapabilityKind;
  name: string;
  description: string;
  enabled: boolean;
  handler?: (input: unknown) => Promise<unknown>;
}

export type PiCapabilityBridgeEntry =
  | {
      status: 'available';
      kind: PiCapabilityKind;
      name: string;
      description: string;
      execute: (input: unknown) => Promise<unknown>;
    }
  | {
      status: 'approved-exclusion';
      kind: PiCapabilityKind;
      name: string;
      reason: string;
    };

export function createPiCapabilityBridge(input: PiCapabilityInput): PiCapabilityBridgeEntry {
  if (!input.enabled || !input.handler) {
    return {
      status: 'approved-exclusion',
      kind: input.kind,
      name: input.name,
      reason: `${input.kind} capability ${input.name} is not available to Pi yet`,
    };
  }

  return {
    status: 'available',
    kind: input.kind,
    name: input.name,
    description: input.description,
    execute: input.handler,
  };
}

export async function executePiCapability(
  entry: PiCapabilityBridgeEntry,
  input: unknown,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  if (entry.status === 'approved-exclusion') {
    return { ok: false, error: entry.reason };
  }

  try {
    return { ok: true, value: await entry.execute(input) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
