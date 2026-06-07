import type { Event as OpenCodeSdkEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { serializeError } from '../../utils/error.js';
import type { AdapterState } from './adapter-state.js';
import type {
  TaskInactivityWatchdogSnapshot,
  TaskInactivityWatchdogTimeoutContext,
} from './TaskInactivityWatchdog.js';
import { TaskInactivityWatchdog } from './TaskInactivityWatchdog.js';

export async function runEventSubscription(
  state: AdapterState,
  signal: AbortSignal,
  onSdkEvent: (event: OpenCodeSdkEvent) => void,
): Promise<void> {
  if (!state.client) return;
  let subscription;
  try {
    subscription = await state.client.event.subscribe({}, {
      throwOnError: true,
      signal,
    } as unknown as Parameters<OpencodeClient['event']['subscribe']>[1]);
  } catch (err) {
    if (!state.isDisposed && !state.wasInterrupted) {
      state.emit('error', err instanceof Error ? err : new Error(String(err)));
      markTaskComplete(state, 'error', err instanceof Error ? err.message : String(err));
    }
    return;
  }

  try {
    const stream = (subscription as { stream: AsyncIterable<OpenCodeSdkEvent> }).stream;
    for await (const event of stream) {
      if (signal.aborted) break;
      try {
        onSdkEvent(event);
      } catch (err) {
        const log = { warn: (m: string, d?: unknown) => console.warn(m, d) };
        log.warn('event handler threw', { error: serializeError(err) });
      }
    }
  } catch (err) {
    if (!state.isDisposed && !state.wasInterrupted && !signal.aborted) {
      state.emit('error', err instanceof Error ? err : new Error(String(err)));
      markTaskComplete(state, 'error', err instanceof Error ? err.message : String(err));
    }
  } finally {
    const maybeClose = (subscription as { close?: () => void | Promise<void> }).close;
    if (typeof maybeClose === 'function') {
      try {
        await Promise.resolve(maybeClose.call(subscription));
      } catch {}
    }
  }
}

export async function abortSession(
  state: AdapterState,
  reason: 'cancel' | 'interrupt' | 'log-error',
): Promise<void> {
  state.eventAbortController?.abort();
  if (state.client && state.currentSessionId) {
    try {
      await state.client.session.abort(
        { sessionID: state.currentSessionId },
        { throwOnError: false },
      );
    } catch (err) {
      const log = { debug: (m: string, d?: unknown) => console.debug(m, d) };
      log.debug?.(`session.abort (${reason}) threw`, { error: serializeError(err) });
    }
  }
}

export function teardown(state: AdapterState): void {
  state.watchdog?.stop();
  state.watchdog = null;
  state.eventAbortController?.abort();
  state.eventAbortController = null;
  state.eventStreamPromise = null;
  state.pendingRequest = null;
  state.client = null;
  state.options.setProxyTaskId?.(undefined);
}

export function markTaskComplete(
  state: AdapterState,
  status: 'success' | 'error',
  error?: string,
): void {
  if (state.hasCompleted) return;
  state.hasCompleted = true;
  const result: { status: string; sessionId?: string; error?: string } = {
    status,
    sessionId: state.currentSessionId || undefined,
  };
  if (error) result.error = error;
  state.emit('complete', result as never);
}

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
