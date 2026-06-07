import { type CliResolverConfig, resolveCliPath } from '@myboteam/agent-core';
import { type ChildProcess, spawn, spawnSync } from 'child_process';
import { log } from '../logger.js';
import {
  READY_TIMEOUT_MS,
  type ServerManagerDeps,
  type TrackedOpencodeServerHandle,
} from './server-config.js';
import { parseServerUrlFromOutput } from './server-transient.js';

const activeRuntimePids = new Set<number>();
let runtimeCleanupRegistered = false;

function ensureRuntimeCleanupRegistered(): void {
  if (runtimeCleanupRegistered) return;
  runtimeCleanupRegistered = true;
  process.on('exit', () => {
    for (const pid of activeRuntimePids) {
      killProcessTree(pid);
    }
  });
}

function killProcessTree(pid: number): void {
  if (!Number.isInteger(pid) || pid <= 0) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 2000,
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(-pid, 'SIGKILL');
    return;
  } catch {
    spawnSync('pkill', ['-9', '-P', String(pid)], {
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 2000,
    });
  }
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // Process already exited — fine.
  }
}

function trackRuntimePid(proc: ChildProcess): number {
  if (!proc.pid) {
    throw new Error('OpenCode server process did not expose a pid');
  }
  const pid = proc.pid;
  ensureRuntimeCleanupRegistered();
  activeRuntimePids.add(pid);
  proc.once('exit', () => {
    activeRuntimePids.delete(pid);
  });
  return pid;
}

let cachedOpencodeBinPath: string | null = null;

function getOpencodeBinPath(deps: ServerManagerDeps): string {
  if (cachedOpencodeBinPath) return cachedOpencodeBinPath;
  const cliConfig: CliResolverConfig = {
    isPackaged: deps.isPackaged,
    resourcesPath: deps.resourcesPath,
    appPath: deps.appPath,
  };
  const resolved = resolveCliPath(cliConfig);
  if (!resolved) {
    throw new Error(
      `Cannot locate opencode-ai CLI. resolveCliPath returned null for ` +
        `(isPackaged=${deps.isPackaged}, resourcesPath=${deps.resourcesPath}, appPath=${deps.appPath}).`,
    );
  }
  cachedOpencodeBinPath = resolved.cliPath;
  return resolved.cliPath;
}

export function spawnOpenCodeServer(
  runtimeEnv: NodeJS.ProcessEnv,
  deps: ServerManagerDeps,
  signal?: AbortSignal,
  onClosed?: () => void,
): Promise<TrackedOpencodeServerHandle> {
  const command = getOpencodeBinPath(deps);
  const args = ['serve', '--hostname=127.0.0.1', '--port=0'];
  const mergedEnv: NodeJS.ProcessEnv = { ...process.env, ...runtimeEnv };
  const proc = spawn(command, args, {
    detached: process.platform !== 'win32',
    env: mergedEnv,
    signal,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  return new Promise((resolve, reject) => {
    let runtimePid: number | null = null;
    let output = '';
    let stdoutBuffer = '';
    let settled = false;
    let closed = false;
    let closeNotified = false;

    const readyTimeout = setTimeout(() => {
      settle(() => {
        close();
        reject(new Error(`Timeout waiting for server to start after ${READY_TIMEOUT_MS}ms`));
      });
    }, READY_TIMEOUT_MS);

    const settle = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(readyTimeout);
      proc.stdout?.removeListener('data', onStdout);
      proc.stderr?.removeListener('data', onStderr);
      signal?.removeEventListener('abort', onAbort);
      callback();
    };

    const notifyClosed = (): void => {
      if (closeNotified) return;
      closeNotified = true;
      onClosed?.();
    };

    const close = (): void => {
      if (closed) return;
      closed = true;
      if (runtimePid !== null) {
        activeRuntimePids.delete(runtimePid);
        killProcessTree(runtimePid);
      }
      proc.stdout?.destroy();
      proc.stderr?.destroy();
    };

    const onStdout = (chunk: Buffer | string): void => {
      const text = chunk.toString();
      output += text;
      stdoutBuffer += text;
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() ?? '';
      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (settled) {
          log.info(`[opencode:stdout] ${trimmed}`);
        }
        const url = parseServerUrlFromOutput(trimmed);
        if (!url) continue;
        settle(() => {
          log.info(`[opencode:stdout] ${trimmed}`);
          resolve({ url, close });
        });
        return;
      }
    };

    const onStderr = (chunk: Buffer | string): void => {
      const text = chunk.toString();
      output += text;
      for (const rawLine of text.split('\n')) {
        const trimmed = rawLine.trim();
        if (trimmed) log.warn(`[opencode:stderr] ${trimmed}`);
      }
    };

    const onExit = (code: number | null): void => {
      close();
      notifyClosed();
      const level = settled ? 'info' : 'warn';
      log[level](
        `[opencode:exit] opencode-serve exited with code ${code} after ${output.trim().length} bytes of output (settled=${settled})`,
      );
      if (settled) return;
      settle(() => {
        let message = `OpenCode server exited with code ${code}`;
        if (output.trim()) message += `\nServer output: ${output}`;
        reject(new Error(message));
      });
    };

    const onError = (error: Error): void => {
      close();
      notifyClosed();
      if (settled) return;
      settle(() => {
        reject(error);
      });
    };

    const onAbort = (): void => {
      settle(() => {
        close();
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      });
    };

    proc.stdout?.on('data', onStdout);
    proc.stderr?.on('data', onStderr);
    proc.on('exit', onExit);
    proc.on('error', onError);
    signal?.addEventListener('abort', onAbort, { once: true });

    if (proc.pid) {
      runtimePid = trackRuntimePid(proc);
    }
  });
}
