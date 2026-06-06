import type { IpcMainInvokeEvent } from 'electron';
import { BrowserWindow, ipcMain } from 'electron';
import { normalizeIpcError } from '../../ipc/validation';
import { getLogCollector } from '../../logging';

export const API_KEY_VALIDATION_TIMEOUT_MS = 15000;
export const MAX_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function assertTrustedWindow(window: BrowserWindow | null): BrowserWindow {
  if (!window || window.isDestroyed()) {
    throw new Error('Untrusted window');
  }

  const focused = BrowserWindow.getFocusedWindow();
  if (BrowserWindow.getAllWindows().length > 1 && focused && focused.id !== window.id) {
    throw new Error('IPC request must originate from the focused window');
  }

  return window;
}

export function isE2ESkipAuthEnabled(): boolean {
  return (
    (global as Record<string, unknown>).E2E_SKIP_AUTH === true ||
    process.argv.includes('--e2e-skip-auth') ||
    process.env.E2E_SKIP_AUTH === '1'
  );
}

const DAEMON_UNAVAILABLE_MESSAGES = [
  'Daemon not bootstrapped',
  'Client closed',
  'myboteam_runtime_unavailable',
];

export function isDaemonUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return DAEMON_UNAVAILABLE_MESSAGES.some((msg) => error.message.includes(msg));
}

export function handle<Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => ReturnType,
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...(args as Args));
    } catch (error) {
      if (isDaemonUnavailableError(error)) {
        try {
          const l = getLogCollector();
          if (l?.log) {
            l.log('WARN', 'ipc', `IPC handler ${channel} skipped — daemon unavailable`, {
              error: String(error),
            });
          }
        } catch {
          /* best-effort logging */
        }
        throw normalizeIpcError(error);
      }
      try {
        const l = getLogCollector();
        if (l?.log) {
          l.log('ERROR', 'ipc', `IPC handler ${channel} failed`, { error: String(error) });
        }
      } catch (_e) {
        /* best-effort logging */
      }
      throw normalizeIpcError(error);
    }
  });
}
