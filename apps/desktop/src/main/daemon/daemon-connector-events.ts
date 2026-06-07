import type { createSocketTransport, DaemonClient } from '@myboteam/agent-core/desktop-main';
import { BrowserWindow } from 'electron';
import {
  type ConnectionStateHandler,
  DaemonRestartError,
  getDataDir,
  log,
  SPAWN_READY_TIMEOUT_MS,
  sleep,
  tryConnectBuildChecked,
  waitForDaemon,
} from './daemon-connector';
import { spawnDaemon } from './daemon-connector-transport';

export const RECONNECT_INITIAL_MS = 200;
export const RECONNECT_MAX_MS = 5000;
export const RECONNECT_MAX_ATTEMPTS = 10;

let reconnecting = false;
let reconnectSuppressed = false;
let onStateChange: ConnectionStateHandler | null = null;
let onClientReplaced: ((client: DaemonClient) => void) | null = null;

export function isDaemonStopped(): boolean {
  return reconnectSuppressed;
}

export function suppressReconnect(): void {
  reconnectSuppressed = true;
  log('INFO', '[DaemonConnector] Reconnection suppressed');
}

export function enableReconnect(): void {
  reconnectSuppressed = false;
  log('INFO', '[DaemonConnector] Reconnection re-enabled');
}

export function onReconnect(
  stateHandler: ConnectionStateHandler,
  clientHandler: (client: DaemonClient) => void,
): void {
  onStateChange = stateHandler;
  onClientReplaced = clientHandler;
}

export function setupDisconnectHandler(
  _client: DaemonClient,
  transport: Awaited<ReturnType<typeof createSocketTransport>>,
): void {
  transport.onDisconnect(() => {
    if (reconnecting || reconnectSuppressed) {
      return;
    }
    reconnecting = true;
    log('WARN', '[DaemonConnector] Daemon disconnected — starting reconnection...');

    onStateChange?.('disconnected');
    broadcastToRenderer('daemon:disconnected');

    void reconnectWithBackoff().finally(() => {
      reconnecting = false;
    });
  });
}

async function reconnectWithBackoff(): Promise<void> {
  let delay = RECONNECT_INITIAL_MS;

  for (let attempt = 1; attempt <= RECONNECT_MAX_ATTEMPTS; attempt++) {
    if (reconnectSuppressed) {
      log('INFO', '[DaemonConnector] Reconnect loop cancelled (suppressed)');
      return;
    }

    onStateChange?.('reconnecting');
    log('INFO', `[DaemonConnector] Reconnect attempt ${attempt}/${RECONNECT_MAX_ATTEMPTS}...`);

    await sleep(delay);

    if (reconnectSuppressed) {
      log('INFO', '[DaemonConnector] Reconnect loop cancelled after delay (suppressed)');
      return;
    }

    const dataDir = getDataDir();
    let client: DaemonClient | null = null;
    try {
      client = await tryConnectBuildChecked(dataDir);
    } catch (err) {
      if (err instanceof DaemonRestartError) {
        log('ERROR', `[DaemonConnector] ${String(err)}`);
        broadcastToRenderer('daemon:reconnect-failed');
        return;
      }
    }

    if (client) {
      log('INFO', '[DaemonConnector] Reconnected to daemon');
      onStateChange?.('connected');
      onClientReplaced?.(client);
      broadcastToRenderer('daemon:reconnected');
      return;
    }

    delay = Math.min(delay * 2, RECONNECT_MAX_MS);
  }

  if (reconnectSuppressed) {
    log('INFO', '[DaemonConnector] Reconnect spawn cancelled (suppressed)');
    return;
  }

  log('WARN', '[DaemonConnector] All reconnect attempts failed — spawning new daemon...');
  const dataDir = getDataDir();
  spawnDaemon(dataDir);

  try {
    const client = await waitForDaemon(dataDir, SPAWN_READY_TIMEOUT_MS);
    log('INFO', '[DaemonConnector] Connected to newly spawned daemon after reconnect');
    onStateChange?.('connected');
    onClientReplaced?.(client);
    broadcastToRenderer('daemon:reconnected');
  } catch (err) {
    log('ERROR', `[DaemonConnector] Failed to reconnect: ${String(err)}`);
    broadcastToRenderer('daemon:reconnect-failed');
  }
}

function broadcastToRenderer(channel: string): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      try {
        win.webContents.send(channel);
      } catch {}
    }
  }
}
