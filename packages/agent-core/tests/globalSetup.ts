/**
 * Vitest global setup — runs once in the main process before any test workers start.
 *
 * Handles:
 *
 * 1. Port 9228 left bound from a previous interrupted test run (azure-foundry-proxy tests).
 *    We kill any process holding that port so the proxy tests can bind it cleanly.
 */

import { execSync } from 'node:child_process';

export async function setup(): Promise<void> {
  checkNodeVersion();
  freePort(9228);
}

function checkNodeVersion(): void {
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 22) {
    process.env.SKIP_NODE22_TESTS = '1';
  }
}

function freePort(port: number): void {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pid = out.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      }
    } else {
      execSync(`lsof -ti tcp:${port} | xargs kill -9 2>/dev/null || true`, { shell: true });
    }
  } catch {
    // Port not in use or command unavailable — nothing to do
  }
}
