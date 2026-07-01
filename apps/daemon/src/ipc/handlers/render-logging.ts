import { createChildLogger } from '../logger.js';

const log = createChildLogger('render-logging');

export interface RenderLogEntry {
  requestId: string;
  clientId: string;
  type: string;
  startTime: number;
  endTime?: number;
  success?: boolean;
  error?: string;
}

const activeRenders = new Map<string, RenderLogEntry>();

export function logRenderStart(entry: RenderLogEntry): void {
  activeRenders.set(entry.requestId, entry);
  log.info('Render started', {
    requestId: entry.requestId,
    clientId: entry.clientId,
    type: entry.type,
  });
}

export function logRenderEnd(requestId: string, success: boolean, error?: string): void {
  const entry = activeRenders.get(requestId);
  if (entry) {
    entry.endTime = Date.now();
    entry.success = success;
    entry.error = error;
    activeRenders.delete(requestId);

    const durationMs = entry.endTime - entry.startTime;
    log.info('Render completed', {
      requestId,
      clientId: entry.clientId,
      type: entry.type,
      success,
      durationMs,
      error,
    });
  }
}

export function getActiveRenderCount(): number {
  return activeRenders.size;
}

export function getActiveRenders(): RenderLogEntry[] {
  return Array.from(activeRenders.values());
}
