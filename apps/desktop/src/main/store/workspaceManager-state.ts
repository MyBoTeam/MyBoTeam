import type { Workspace } from '@myboteam/agent-core/desktop-main';
import { getLogCollector } from '../logging';

export const _state = {
  activeWorkspaceId: null as string | null,
  workspaces: new Map<string, Workspace>(),
  initialized: false,
};

export function log(
  level: 'INFO' | 'WARN' | 'ERROR',
  msg: string,
  data?: Record<string, unknown>,
): void {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'main', msg, data);
    }
  } catch {
    /* best-effort logging */
  }
}
