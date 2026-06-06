import type { DaemonClient } from '@myboteam/agent-core/desktop-main';
import type { BrowserWindow } from 'electron';
import { classifyErrorCategory, trackTaskComplete, trackTaskError } from './analytics/events';
import { getLogCollector } from './logging';

export const taskContextMap = new Map<
  string,
  { startTime: number; sessionId: string; taskType: string }
>();

function log(level: 'INFO' | 'WARN' | 'ERROR', msg: string): void {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'daemon', msg);
    }
  } catch {
    /* best-effort */
  }
}

export let windowGetter: (() => BrowserWindow | null) | null = null;

export function setWindowGetter(getter: (() => BrowserWindow | null) | null): void {
  windowGetter = getter;
}

export function rebindWorkspaceManager(): void {
  void import('./store/workspaceManager')
    .then((workspaceManager) => {
      if (workspaceManager.isInitialized()) {
        return workspaceManager.initialize();
      }
      return undefined;
    })
    .catch((err: unknown) => {
      log(
        'WARN',
        `[DaemonBootstrap] workspaceManager rebind after client swap failed: ${String(err)}`,
      );
    });
}

export function registerNotificationHandlers(
  client: DaemonClient,
  getWindow: () => BrowserWindow | null,
): void {
  const forward = (channel: string, data: unknown): void => {
    const win = getWindow();
    if (!win || win.isDestroyed()) {
      return;
    }
    try {
      win.webContents.send(channel, data);
    } catch {
      /* Window torn down between check and send */
    }
  };

  client.onNotification('task.progress', (data) => {
    forward('task:progress', data);
    if (data.taskId && !taskContextMap.has(data.taskId)) {
      taskContextMap.set(data.taskId, {
        startTime: Date.now(),
        sessionId: ((data as unknown as Record<string, unknown>).sessionId as string) ?? '',
        taskType: 'chat',
      });
    }
  });

  client.onNotification('task.message', (data) => {
    forward('task:update:batch', data);
  });

  client.onNotification('task.complete', (data) => {
    forward('task:update', { taskId: data.taskId, type: 'complete', result: data.result });
    try {
      const ctx = taskContextMap.get(data.taskId);
      const durationMs = ctx ? Date.now() - ctx.startTime : 0;
      trackTaskComplete(
        { taskId: data.taskId, sessionId: ctx?.sessionId ?? '', taskType: ctx?.taskType ?? 'chat' },
        durationMs,
        0,
        false,
      );
      taskContextMap.delete(data.taskId);
    } catch {
      /* best-effort analytics */
    }
  });

  client.onNotification('task.error', (data) => {
    forward('task:update', { taskId: data.taskId, type: 'error', error: data.error });
    try {
      const ctx = taskContextMap.get(data.taskId);
      const durationMs = ctx ? Date.now() - ctx.startTime : 0;
      trackTaskError(
        { taskId: data.taskId, sessionId: ctx?.sessionId ?? '', taskType: ctx?.taskType ?? 'chat' },
        durationMs,
        0,
        classifyErrorCategory(data.error ?? 'unknown'),
      );
      taskContextMap.delete(data.taskId);
    } catch {
      /* best-effort analytics */
    }
  });

  client.onNotification('task.statusChange', (data) => {
    forward('task:status-change', data);
  });

  client.onNotification('task.summary', (data) => {
    forward('task:summary', data);
  });

  client.onNotification('permission.request', (data) => {
    forward('permission:request', data);
  });

  client.onNotification('todo.update', (data) => {
    forward('todo:update', data);
  });

  client.onNotification('auth.error', (data) => {
    forward('auth:error', data);
  });

  client.onNotification('browser.frame', (data) => {
    forward('browser:frame', data);
  });

  client.onNotification('myboteam-ai.usage-update', (data) => {
    forward('myboteam-ai:usage-updated', data);
  });

  client.onNotification('whatsapp.qr', (data) => {
    forward('integrations:whatsapp:qr', (data as { qr: string }).qr);
  });

  client.onNotification('whatsapp.status', (data) => {
    forward('integrations:whatsapp:status', (data as { status: string }).status);
  });

  client.onNotification('gwsAccount.statusChanged', (data) => {
    const payload = data as { googleAccountId: string; status: string };
    const win = getWindow();
    if (!win || win.isDestroyed()) {
      return;
    }
    try {
      win.webContents.send('gws:account:status-changed', payload.googleAccountId, payload.status);
    } catch {
      /* window torn down between check and send */
    }
  });

  client.onNotification('skills.changed', (data) => {
    forward('skills:changed', data);
  });
}
