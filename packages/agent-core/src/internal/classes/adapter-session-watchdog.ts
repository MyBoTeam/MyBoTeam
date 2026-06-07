import { markTaskComplete } from './adapter-session-lifecycle.js';
import type { AdapterState } from './adapter-state.js';
import type {
  TaskInactivityWatchdogSnapshot,
  TaskInactivityWatchdogTimeoutContext,
} from './TaskInactivityWatchdog.js';
import { TaskInactivityWatchdog } from './TaskInactivityWatchdog.js';

export function startWatchdog(state: AdapterState): void {
  state.watchdog?.stop();
  state.watchdog = new TaskInactivityWatchdog({
    sample: async () => sampleWatchdogState(state),
    onSoftTimeout: async (ctx) => handleWatchdogSoftTimeout(state, ctx),
    onHardTimeout: async (ctx) => handleWatchdogHardTimeout(state, ctx),
    onDebug: (type, message, data) => {
      const log = { warn: (m: string, d?: unknown) => console.warn(m, d) };
      log.warn(`[watchdog] ${type}: ${message}`, { data });
    },
  });
  state.watchdog.start();
}

export function sampleWatchdogState(state: AdapterState): TaskInactivityWatchdogSnapshot {
  const fingerprint = [
    state.currentSessionId ?? 'no-session',
    state.watchdogActivityCounter,
    state.pendingRequest?.sdkRequestId ?? 'no-pending',
  ].join(':');
  const inProgress =
    !state.hasCompleted &&
    state.client !== null &&
    !state.isDisposed &&
    state.pendingRequest === null;
  return {
    fingerprint,
    inProgress,
    summary: state.currentSessionId ?? undefined,
  };
}

function handleWatchdogSoftTimeout(
  state: AdapterState,
  ctx: TaskInactivityWatchdogTimeoutContext,
): void {
  const log = { warn: (m: string, d?: unknown) => console.warn(m, d) };
  log.warn(
    `[watchdog] Task stalled (soft timeout, attempt ${ctx.attempt}, elapsed ${ctx.elapsedMs}ms). Waiting for recovery...`,
    { sessionId: state.currentSessionId, taskId: state.currentTaskId },
  );
}

export function handleWatchdogHardTimeout(
  state: AdapterState,
  ctx: TaskInactivityWatchdogTimeoutContext,
): void {
  const elapsedSec = Math.round(ctx.elapsedMs / 1000);
  const msg = `Task inactivity watchdog: no SDK events for ${elapsedSec}s (hard timeout)`;
  const log = { error: (m: string, d?: unknown) => console.error(m, d) };
  log.error(`[watchdog] ${msg}`, {
    sessionId: state.currentSessionId,
    taskId: state.currentTaskId,
  });
  if (!state.hasCompleted) {
    state.emit('error', new Error(msg));
    markTaskComplete(state, 'error', msg);
  }
}
