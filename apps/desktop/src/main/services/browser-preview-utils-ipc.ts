import { BrowserWindow } from 'electron';

export type PreviewStatus = 'starting' | 'streaming' | 'loading' | 'ready' | 'stopped' | 'error';

export function sendToRenderer(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

export function emitStatusUpdate(
  taskId: string,
  pageName: string,
  status: PreviewStatus,
  message?: string,
): void {
  sendToRenderer('browser:status', { taskId, pageName, status, message, timestamp: Date.now() });
}

export function emitFrameCapture(
  taskId: string,
  pageName: string,
  data: string,
  width?: number,
  height?: number,
): void {
  sendToRenderer('browser:frame', {
    taskId,
    pageName,
    frame: data,
    width,
    height,
    timestamp: Date.now(),
  });
}

export function emitNavigationEvent(taskId: string, pageName: string, url: string): void {
  sendToRenderer('browser:navigate', { taskId, pageName, url, timestamp: Date.now() });
}
