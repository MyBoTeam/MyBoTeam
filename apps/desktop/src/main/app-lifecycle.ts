import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { trackAppCrash } from './analytics/events';
import { shutdownApp } from './app-shutdown';
import { getLogCollector } from './logging';
import { clearSecureStorage } from './store/secureStorage';
import { isQuittingRef, isShuttingDown, setShuttingDown } from './window-manager';

const CLEAN_START_CONNECT_TIMEOUT_MS = 2_000;
const CLEAN_START_SHUTDOWN_TIMEOUT_MS = 45_000;

type CleanStartDaemonState = 'no-daemon' | 'exited' | 'still-alive';

function logMain(level: 'INFO' | 'WARN' | 'ERROR', msg: string, data?: Record<string, unknown>) {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'main', msg, data);
    }
  } catch (_e) {}
}

async function stopDetachedDaemonForCleanStart(
  userDataPath: string,
): Promise<CleanStartDaemonState> {
  const pidPath = path.join(userDataPath, 'daemon.pid');
  if (!fs.existsSync(pidPath)) {
    return 'no-daemon';
  }

  let DaemonClientCtor: typeof import('@myboteam/agent-core/desktop-main').DaemonClient;
  let createSocketTransport: typeof import('@myboteam/agent-core/desktop-main').createSocketTransport;
  try {
    const mod = await import('@myboteam/agent-core/desktop-main');
    DaemonClientCtor = mod.DaemonClient;
    createSocketTransport = mod.createSocketTransport;
  } catch (err) {
    logMain('WARN', '[Clean Mode] Could not load daemon-client transport; treating as no-daemon', {
      err: String(err),
    });
    return 'no-daemon';
  }

  let transport: Awaited<ReturnType<typeof createSocketTransport>>;
  try {
    transport = await createSocketTransport({
      dataDir: userDataPath,
      connectTimeout: CLEAN_START_CONNECT_TIMEOUT_MS,
    });
  } catch (err) {
    logMain(
      'INFO',
      `[Clean Mode] Could not connect to daemon socket; leaving any stale pid alone. ${String(err)}`,
    );
    return 'no-daemon';
  }

  const client = new DaemonClientCtor({ transport });
  let daemonExited = false;

  try {
    const closePromise = new Promise<void>((resolve) => {
      transport.onDisconnect(() => {
        daemonExited = true;
        resolve();
      });
    });

    logMain('INFO', '[Clean Mode] Connected to detached daemon; sending shutdown RPC');
    try {
      await client.call('daemon.shutdown');
    } catch (err) {
      logMain('INFO', `[Clean Mode] daemon.shutdown RPC returned: ${String(err)}`);
    }

    const timeout = new Promise<void>((resolve) =>
      setTimeout(resolve, CLEAN_START_SHUTDOWN_TIMEOUT_MS),
    );
    await Promise.race([closePromise, timeout]);

    if (daemonExited) {
      logMain('INFO', '[Clean Mode] Detached daemon closed its socket; safe to rmSync');
      return 'exited';
    }

    logMain(
      'ERROR',
      `[Clean Mode] Confirmed-live daemon did not close within ${CLEAN_START_SHUTDOWN_TIMEOUT_MS}ms; ` +
        `refusing to rmSync under a live owner.`,
    );
    return 'still-alive';
  } finally {
    try {
      client.close();
    } catch {}
    try {
      transport.close();
    } catch {}
  }
}

export async function runCleanStart(): Promise<void> {
  if (process.env.CLEAN_START !== '1') {
    return;
  }

  const userDataPath = app.getPath('userData');
  logMain('INFO', `[Clean Mode] Clearing userData directory: ${userDataPath}`);
  const shutdownState = await stopDetachedDaemonForCleanStart(userDataPath);

  if (shutdownState === 'still-alive') {
    const abortMsg =
      '[CLEAN_START] Aborted: an MyBoTeam daemon is still active on this profile and did ' +
      `not exit within ${CLEAN_START_SHUTDOWN_TIMEOUT_MS / 1000}s. Deleting userData under a ` +
      'live owner would corrupt SQLite and secure-storage state.\n\n' +
      'Fully quit the app (check the system tray for a running daemon) and retry ' +
      'CLEAN_START, or wait for active tasks to finish and let the daemon exit naturally.';
    logMain('ERROR', abortMsg);
    console.error(`\n${abortMsg}\n`);
    process.exit(1);
  }

  try {
    if (fs.existsSync(userDataPath)) {
      fs.rmSync(userDataPath, { recursive: true, force: true });
      logMain('INFO', '[Clean Mode] Successfully cleared userData');
    }
  } catch (err) {
    logMain('ERROR', '[Clean Mode] Failed to clear userData', { err: String(err) });
  }
  clearSecureStorage();
  logMain('INFO', '[Clean Mode] userData wiped; daemon will reinitialize on spawn');
}

export function registerLifecycleHooks(): void {
  process.on('uncaughtException', (error) => {
    try {
      getLogCollector()?.log?.('ERROR', 'main', `Uncaught exception: ${error.message}`, {
        name: error.name,
        stack: error.stack,
      });
      trackAppCrash(error.name || 'uncaughtException', error.message || 'Unknown error');
    } catch {}
  });
  process.on('unhandledRejection', (reason) => {
    try {
      getLogCollector()?.log?.('ERROR', 'main', 'Unhandled promise rejection', { reason });
      trackAppCrash('unhandledRejection', String(reason).substring(0, 500));
    } catch {}
  });

  app.on('window-all-closed', () => {
    logMain('INFO', '[Main] All windows closed — app continues in system tray');
  });

  app.on('before-quit', (event) => {
    if (isShuttingDown) {
      return;
    }
    setShuttingDown(true);
    isQuittingRef.value = true;
    event.preventDefault();
    let logger: ReturnType<typeof getLogCollector> | null = null;
    try {
      logger = getLogCollector();
    } catch {}
    void shutdownApp(logger);
  });
}
