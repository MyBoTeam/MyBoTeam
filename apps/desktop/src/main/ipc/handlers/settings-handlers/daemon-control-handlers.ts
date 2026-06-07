import type { IpcMainInvokeEvent } from 'electron';
import { app } from 'electron';
import { getDaemonClient } from '../../../daemon-bootstrap';

type HandleFn = <Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => ReturnType,
) => void;

export function registerDaemonControlHandlers(handle: HandleFn): void {
  handle('daemon:get-socket-path', async () => {
    const { getSocketPath } = await import('@myboteam/agent-core/desktop-main');
    return getSocketPath(app.getPath('userData'));
  });

  handle('daemon:ping', async () => {
    const { getDaemonClient } = await import('../../../daemon-bootstrap');
    try {
      const client = getDaemonClient();
      return await client.ping();
    } catch {
      return { status: 'disconnected', uptime: 0 };
    }
  });

  handle('daemon:restart', async () => {
    const { getDaemonClient, shutdownDaemon, bootstrapDaemon } = await import(
      '../../../daemon-bootstrap'
    );
    const { suppressReconnect, enableReconnect } = await import(
      '../../../daemon/daemon-connector-events'
    );

    suppressReconnect();
    try {
      try {
        const client = getDaemonClient();
        client.call('daemon.shutdown').catch(() => {});
      } catch {}
      shutdownDaemon();

      try {
        const { getPidFilePath } = await import('@myboteam/agent-core/desktop-main');
        const { getDataDir } = await import('../../../daemon/daemon-connector');
        const fs = await import('node:fs');
        const pidPath = getPidFilePath(getDataDir());

        const deadline = Date.now() + 10_000;
        while (Date.now() < deadline) {
          if (!fs.existsSync(pidPath)) {
            break;
          }
          try {
            const content = fs.readFileSync(pidPath, 'utf8');
            const pid = JSON.parse(content).pid;
            process.kill(pid, 0);
            await new Promise((r) => setTimeout(r, 100));
          } catch {
            break;
          }
        }
      } catch {}

      try {
        const { getSocketPath } = await import('@myboteam/agent-core/desktop-main');
        const { getDataDir } = await import('../../../daemon/daemon-connector');
        const fs = await import('node:fs');
        const socketPath = getSocketPath(getDataDir());
        if (fs.existsSync(socketPath)) {
          fs.unlinkSync(socketPath);
        }
      } catch {}

      await bootstrapDaemon();
      return { success: true };
    } finally {
      enableReconnect();
    }
  });

  handle('daemon:stop', async () => {
    const { getDaemonClient, shutdownDaemon } = await import('../../../daemon-bootstrap');
    const { suppressReconnect } = await import('../../../daemon/daemon-connector-events');

    suppressReconnect();
    try {
      const client = getDaemonClient();
      client.call('daemon.shutdown').catch(() => {});
    } catch {}
    shutdownDaemon();

    try {
      const { getPidFilePath } = await import('@myboteam/agent-core/desktop-main');
      const { getDataDir } = await import('../../../daemon/daemon-connector');
      const fs = await import('node:fs');
      const pidPath = getPidFilePath(getDataDir());

      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        if (!fs.existsSync(pidPath)) {
          break;
        }
        try {
          const content = fs.readFileSync(pidPath, 'utf8');
          const pid = JSON.parse(content).pid;
          process.kill(pid, 0);
          await new Promise((r) => setTimeout(r, 100));
        } catch {
          break;
        }
      }
    } catch {}

    return { success: true };
  });

  handle('daemon:start', async () => {
    const { bootstrapDaemon } = await import('../../../daemon-bootstrap');
    const { enableReconnect } = await import('../../../daemon/daemon-connector-events');

    await bootstrapDaemon();
    enableReconnect();
    return { success: true };
  });

  handle('daemon:is-auto-start-enabled', async () => {
    const { isAutoStartEnabled } = await import('../../../daemon/service-manager');
    return isAutoStartEnabled();
  });

  handle('daemon:get-close-behavior', async () => {
    return getDaemonClient().call('settings.getCloseBehavior');
  });

  handle('daemon:set-close-behavior', async (_event: IpcMainInvokeEvent, behavior: string) => {
    if (behavior !== 'keep-daemon' && behavior !== 'stop-daemon') {
      throw new Error(`Invalid close behavior: ${behavior}`);
    }
    await getDaemonClient().call('settings.setCloseBehavior', {
      behavior: behavior as 'keep-daemon' | 'stop-daemon',
    });
  });
}
