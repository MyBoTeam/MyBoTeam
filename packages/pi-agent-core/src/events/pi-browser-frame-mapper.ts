import type { BrowserFramePayload } from '../adapter/task-runtime-types.js';

export interface PiBrowserFrameEvent {
  frame: string;
  pageName?: string;
  timestamp?: number;
  taskId?: string;
}

export function mapPiBrowserFrameEvent(
  event: PiBrowserFrameEvent,
  defaults: { pageName: string; taskId?: string; timestamp?: number },
): BrowserFramePayload {
  return {
    frame: event.frame,
    pageName: event.pageName ?? defaults.pageName,
    timestamp: event.timestamp ?? defaults.timestamp ?? Date.now(),
    taskId: event.taskId ?? defaults.taskId,
  };
}
