import type { DaemonClient } from '@myboteam/agent-core/desktop-main';
import { createSocketTransport } from '@myboteam/agent-core/desktop-main';
import type { BrowserWindow } from 'electron';
import { ensureDaemonRunning, getDataDir } from './daemon/daemon-connector';
import { onReconnect, setupDisconnectHandler } from './daemon/daemon-connector-events';
import { tailDaemonLog } from './daemon/daemon-connector-transport';
import { getDaemonClient, setClient, setMode } from './daemon/daemon-lifecycle';
import {
  rebindWorkspaceManager,
  registerNotificationHandlers,
  setWindowGetter,
  windowGetter,
} from './daemon-bootstrap-config';
import { getLogCollector } from './logging';

export { getDaemonClient, shutdownDaemon } from './daemon/daemon-lifecycle';

function log(level: 'INFO' | 'WARN' | 'ERROR', msg: string): void {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'daemon', msg);
    }
  } catch {}
}

export async function bootstrapDaemon(): Promise<DaemonClient> {
  log('INFO', '[DaemonBootstrap] Connecting to daemon...');

  const client = await ensureDaemonRunning();
  setClient(client);
  setMode('socket');

  tailDaemonLog();

  if (windowGetter) {
    registerNotificationHandlers(client, windowGetter);
    log('INFO', '[DaemonBootstrap] Re-registered notification forwarding on new client');
  }

  await setupTransportReconnection(client);

  rebindWorkspaceManager();

  onReconnect(
    (state) => {
      log('INFO', `[DaemonBootstrap] Connection state: ${state}`);
    },
    (newClient) => {
      setClient(newClient);
      if (windowGetter) {
        registerNotificationHandlers(newClient, windowGetter);
      }
      void setupTransportReconnection(newClient);
      rebindWorkspaceManager();
    },
  );

  log('INFO', '[DaemonBootstrap] Connected to daemon via socket');
  return client;
}

async function setupTransportReconnection(client: DaemonClient): Promise<void> {
  try {
    const transport = await createSocketTransport({
      dataDir: getDataDir(),
      connectTimeout: 2000,
    });
    setupDisconnectHandler(client, transport);
  } catch {
    log('WARN', '[DaemonBootstrap] Could not set up disconnect monitor');
  }
}

export function registerNotificationForwarding(getWindow: () => BrowserWindow | null): void {
  setWindowGetter(getWindow);

  let client: DaemonClient;
  try {
    client = getDaemonClient();
  } catch {
    log('WARN', '[DaemonBootstrap] Cannot register notification forwarding — no daemon client');
    return;
  }

  registerNotificationHandlers(client, getWindow);
  log('INFO', '[DaemonBootstrap] Notification forwarding registered');
}
