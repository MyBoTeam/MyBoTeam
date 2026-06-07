import type { DaemonClient } from '@myboteam/agent-core/desktop-main';
import { getLogCollector } from '../logging';

let client: DaemonClient | null = null;
let mode: 'socket' | null = null;

export function setClient(c: DaemonClient | null): void {
  client = c;
}

export function setMode(m: 'socket' | null): void {
  mode = m;
}

export function getDaemonClient(): DaemonClient {
  if (!client) {
    throw new Error('Daemon not bootstrapped. Call bootstrapDaemon() first.');
  }
  return client;
}

export function getDaemonMode(): 'socket' | null {
  return mode;
}

export function shutdownDaemon(): void {
  if (client) {
    client.close();
    client = null;
  }
  mode = null;
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log('INFO', 'daemon', '[DaemonLifecycle] Daemon client disconnected');
    }
  } catch {}
}
