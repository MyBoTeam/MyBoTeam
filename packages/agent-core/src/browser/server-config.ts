import { execFileSync } from 'node:child_process';

export interface ServerStartResult {
  ready: boolean;
  pid?: number;
  logs: string[];
}

export const DEV_BROWSER_WAIT_MS_WIN = 30000;
export const DEV_BROWSER_WAIT_MS_DEFAULT = 15000;

function killProcessOnPort(port: number): void {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
      for (const line of out.split('\n')) {
        if (line.includes(`:${port} `) && line.includes('LISTENING')) {
          const pid = line.trim().split(/\s+/).pop();
          if (pid && /^\d+$/.test(pid)) {
            execFileSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' });
          }
        }
      }
    } else {
      const pids = execFileSync('lsof', ['-t', '-i', `tcp:${port}`, '-sTCP:LISTEN'], {
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter(Boolean);
      for (const pid of pids) {
        process.kill(parseInt(pid, 10), 'SIGTERM');
      }
    }
  } catch {}
}

export async function shutdownDevBrowserServer(config: {
  devBrowserPort: number;
  devBrowserCdpPort?: number;
}): Promise<void> {
  const { devBrowserPort, devBrowserCdpPort } = config;

  let responded = false;
  try {
    const res = await fetch(`http://127.0.0.1:${devBrowserPort}/shutdown`, {
      method: 'POST',
      signal: AbortSignal.timeout(3000),
    });
    responded = res.ok;
  } catch {}

  if (responded) {
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
  }

  killProcessOnPort(devBrowserPort);

  if (devBrowserCdpPort) {
    killProcessOnPort(devBrowserCdpPort);
  }
}
