import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/v2';
import { onBeforeStart } from '../task-config-builder.js';
import type { ServerManagerDeps } from './server-config.js';
import { spawnOpenCodeServer } from './server-lifecycle.js';

export function throwIfStartAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error('Task runtime start aborted');
  error.name = 'AbortError';
  throw error;
}

export function parseServerUrlFromOutput(line: string): string | null {
  if (!line.startsWith('opencode server listening')) return null;
  const match = line.match(/on\s+(https?:\/\/[^\s]+)/);
  return match?.[1] ?? null;
}

export async function createTransientOpencodeClient(
  deps: ServerManagerDeps,
  signal?: AbortSignal,
): Promise<{ client: OpencodeClient; close: () => void }> {
  throwIfStartAborted(signal);
  const { env: runtimeEnv } = await onBeforeStart(deps.storage, deps, {});
  throwIfStartAborted(signal);
  const server = await spawnOpenCodeServer(runtimeEnv, deps, signal);
  return {
    client: createOpencodeClient({ baseUrl: server.url }),
    close: () => server.close(),
  };
}
