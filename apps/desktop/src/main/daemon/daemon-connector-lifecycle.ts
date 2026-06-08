import fs from 'node:fs';
import {
  createSocketTransport,
  DaemonClient,
  getPidFilePath,
  getSocketPath,
} from '@myboteam/agent-core/desktop-main';
import { getBuildId } from '../config/build-config';
import {
  getDataDir,
  LOGIN_ITEM_RETRY_DELAY_MS,
  log,
  POLL_INTERVAL_MS,
  SPAWN_READY_TIMEOUT_MS,
  sleep,
} from './daemon-connector-status';
import { spawnDaemon } from './daemon-connector-transport';

export class DaemonRestartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DaemonRestartError';
  }
}

async function tryConnect(dataDir: string): Promise<DaemonClient | null> {
  let transport: Awaited<ReturnType<typeof createSocketTransport>> | null = null;
  let client: DaemonClient | null = null;
  try {
    transport = await createSocketTransport({ dataDir, connectTimeout: 2000 });
    client = new DaemonClient({ transport });
    await client.ping();
    return client;
  } catch {
    if (client) {
      client.close();
    } else if (transport) {
      transport.close();
    }
    return null;
  }
}

export async function tryConnectBuildChecked(dataDir: string): Promise<DaemonClient | null> {
  const client = await tryConnect(dataDir);
  if (!client) return null;

  try {
    const pingResult = await client.ping();
    const expectedBuildId = getBuildId();

    if (pingResult.buildId === expectedBuildId) {
      return client;
    }

    log(
      'INFO',
      `[DaemonConnector] Build mismatch: daemon=${pingResult.buildId ?? 'none'}, app=${expectedBuildId}. Restarting daemon...`,
    );

    await client.call('daemon.shutdown').catch(() => {});
    client.close();

    await waitForDaemonExit(dataDir, 30_000);
    return null;
  } catch (err) {
    client.close();
    if (err instanceof DaemonRestartError) throw err;
    return null;
  }
}

async function waitForDaemonExit(dataDir: string, timeoutMs: number = 30_000): Promise<void> {
  const pidPath = getPidFilePath(dataDir);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (!fs.existsSync(pidPath)) {
      return;
    }
    try {
      const content = fs.readFileSync(pidPath, 'utf8');
      const { pid } = JSON.parse(content);
      process.kill(pid, 0);
      await sleep(200);
    } catch {
      return;
    }
  }

  throw new DaemonRestartError(
    'Old daemon did not exit within 30s after shutdown request. Please restart the application.',
  );
}

export async function waitForDaemon(dataDir: string, timeoutMs: number): Promise<DaemonClient> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const client = await tryConnect(dataDir);
    if (client) {
      return client;
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Daemon did not become ready within ${timeoutMs}ms. Socket path: ${getSocketPath(dataDir)}`,
  );
}

export async function ensureDaemonRunning(): Promise<DaemonClient> {
  const dataDir = getDataDir();

  log('INFO', '[DaemonConnector] Attempting connection to existing daemon...');
  const existing = await tryConnectBuildChecked(dataDir);
  if (existing) {
    log('INFO', '[DaemonConnector] Connected to existing daemon');
    return existing;
  }

  log('INFO', '[DaemonConnector] No daemon found, retrying after short delay...');
  await sleep(LOGIN_ITEM_RETRY_DELAY_MS);
  const retried = await tryConnectBuildChecked(dataDir);
  if (retried) {
    log('INFO', '[DaemonConnector] Connected to daemon (login item)');
    return retried;
  }

  log('INFO', '[DaemonConnector] Spawning new daemon...');
  spawnDaemon(dataDir);

  const client = await waitForDaemon(dataDir, SPAWN_READY_TIMEOUT_MS);
  log('INFO', '[DaemonConnector] Connected to newly spawned daemon');
  return client;
}
