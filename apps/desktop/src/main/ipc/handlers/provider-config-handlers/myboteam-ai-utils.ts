import type { CreditUsage } from '@myboteam/agent-core/desktop-main';
import { getLogCollector } from '../../../logging';

export type MyBoTeamConnectRpcResult = {
  deviceFingerprint: string;
  usage: CreditUsage | null;
};

export const RUNTIME_UNAVAILABLE_MSG =
  'Free tier is not available in this build. Please use the official MyBoTeam release or connect your own API key.';

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
  } catch {}
}
