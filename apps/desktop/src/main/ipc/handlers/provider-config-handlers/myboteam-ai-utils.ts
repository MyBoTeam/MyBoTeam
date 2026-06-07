/**
 * MyBoTeam AI IPC utilities — shared helpers for myboteam-ai handler registration.
 */

import type { CreditUsage } from '@myboteam/agent-core/desktop-main';
import type { IpcMainInvokeEvent } from 'electron';
import type { getDaemonClient } from '../../../daemon-bootstrap';
import { getLogCollector } from '../../../logging';

export type MyBoTeamConnectRpcResult = {
  deviceFingerprint: string;
  usage: CreditUsage | null;
};

export type HandleFn = <Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => ReturnType,
) => void;

export const RUNTIME_UNAVAILABLE_MSG =
  'Free tier is not available in this build. Please use the official MyBoTeam release or connect your own API key.';

/** Normalize runtime-unavailable errors to a user-friendly message. */
export function normalizeRuntimeError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('myboteam_runtime_unavailable')) {
    throw new Error(RUNTIME_UNAVAILABLE_MSG);
  }
  throw err;
}

export function log(level: 'INFO' | 'WARN' | 'ERROR', msg: string) {
  try {
    getLogCollector()?.log(level, 'main' as const, `[myboteam-ai] ${msg}`);
  } catch {
    /* best-effort */
  }
}

/** Predicate mirror of the pre-M5 `storage.hasReadyProvider()` — any
 *  connected provider with `connection_status='connected'` and a non-null
 *  `selected_model_id`. Evaluated against the settings snapshot the caller
 *  has already fetched so we don't round-trip twice. */
export function hasReadyProvider(
  settings: Awaited<ReturnType<ReturnType<typeof getDaemonClient>['call']>> extends infer _
    ? {
        connectedProviders: Record<
          string,
          { connectionStatus: string; selectedModelId: string | null } | undefined
        >;
      }
    : never,
): boolean {
  return Object.values(settings.connectedProviders).some(
    (p) => p?.connectionStatus === 'connected' && !!p.selectedModelId,
  );
}
