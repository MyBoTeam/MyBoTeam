#!/usr/bin/env node

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import waitOn from 'wait-on';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const isClean = args.has('--clean');

const pnpmBin = platform() === 'win32' ? 'pnpm.cmd' : 'pnpm';
const WEB_PORT = 5173;
const RENDERER_URL = `http://localhost:${WEB_PORT}`;
const DAEMON_DATA_DIR = join(homedir(), '.myboteam');

const envFile = join(root, '.env');
if (existsSync(envFile)) {
  const content = readFileSync(envFile, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

killDaemon();

if (isClean) {
  const appDir = 'myboteam';
  const userDataPath =
    platform() === 'darwin'
      ? join(homedir(), 'Library', 'Application Support', appDir)
      : platform() === 'win32'
        ? join(process.env.APPDATA ?? homedir(), appDir)
        : join(homedir(), '.config', appDir);
  if (existsSync(userDataPath)) {
    process.stdout.write(`[dev:clean] Removing ${userDataPath}...\n`);
    rmSync(userDataPath, { recursive: true, force: true });
  }
  if (existsSync(DAEMON_DATA_DIR)) {
    process.stdout.write(`[dev:clean] Removing ${DAEMON_DATA_DIR}...\n`);
    rmSync(DAEMON_DATA_DIR, { recursive: true, force: true });
  }
  process.stdout.write('[dev:clean] DB, vault, and all config wiped clean\n');
}

function killDaemon() {
  if (platform() === 'win32') return;
  const pidFile = join(DAEMON_DATA_DIR, 'daemon.pid');
  if (!existsSync(pidFile)) return;
  const pidStr = readFileSync(pidFile, 'utf-8').trim();
  const pid = parseInt(pidStr, 10);
  if (!Number.isInteger(pid) || pid <= 0) return;
  try {
    process.kill(pid, 0);
    process.stdout.write(`[dev] Stopping existing daemon (PID ${pid})...\n`);
    process.kill(pid, 'SIGTERM');
    let waited = 0;
    while (waited < 3000) {
      try {
        process.kill(pid, 0);
      } catch {
        break;
      }
      waited += 100;
    }
    if (waited >= 3000) {
      process.kill(pid, 'SIGKILL');
    }
    process.stdout.write('[dev] Daemon stopped\n');
  } catch {}
  try {
    rmSync(join(DAEMON_DATA_DIR, 'daemon.sock'), { force: true });
    rmSync(pidFile, { force: true });
  } catch {}
}

function buildPackage(pkgName, pkgDir) {
  const pkgJsonPath = join(root, pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    process.stdout.write(`[dev] Skipping ${pkgName} (no package.json yet)\n`);
    return;
  }
  process.stdout.write(`[dev] Building ${pkgName}...\n`);
  execSync(`${pnpmBin} --filter ${pkgName} build`, { cwd: root, stdio: 'inherit' });
}

const env = { ...process.env, RENDERER_URL, NODE_ENV: 'development' };

let shuttingDown = false;
let webProc = null;
let desktopProc = null;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (webProc) webProc.kill();
  if (desktopProc) desktopProc.kill();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function freePort(port) {
  try {
    if (platform() === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      const pids = [
        ...new Set(
          output
            .split('\n')
            .map((l) => l.trim().split(/\s+/).pop())
            .filter((p) => p && /^\d+$/.test(p) && p !== '0'),
        ),
      ];
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
        } catch {}
      }
    } else {
      execSync(`lsof -ti:${port} -sTCP:LISTEN | xargs kill -9 2>/dev/null || true`, {
        shell: true,
        stdio: 'pipe',
      });
    }
  } catch {}
}

process.stdout.write(`[dev] Freeing port ${WEB_PORT} if occupied...\n`);
freePort(WEB_PORT);

buildPackage('@myboteam/daemon', 'apps/daemon');

process.stdout.write(`[dev] Starting web dev server at ${RENDERER_URL}...\n`);
webProc = spawn(pnpmBin, ['--filter', '@myboteam/web', 'dev'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: platform() === 'win32',
});
webProc.on('exit', (code) => {
  if (!shuttingDown) {
    process.stderr.write(`\n[dev] Web dev server exited unexpectedly (code ${code}).\n`);
    process.stderr.write(
      '[dev]    Check the output above for errors (e.g. port conflict, syntax error).\n',
    );
    shutdown(code ?? 1);
  }
});

process.stdout.write(`[dev] Waiting for web dev server at ${RENDERER_URL}...\n`);
waitOn({ resources: [RENDERER_URL], timeout: 30000 })
  .then(() => {
    if (shuttingDown) return;
    process.stdout.write('[dev] Web dev server ready. Starting Electron...\n');
    process.stdout.write('[dev] Building Electron main + preload...\n');
    execSync(`${pnpmBin} --filter @myboteam/desktop exec electron-vite build`, {
      cwd: root,
      stdio: 'inherit',
    });
    desktopProc = spawn(pnpmBin, ['--filter', '@myboteam/desktop', 'start'], {
      cwd: root,
      env,
      stdio: 'inherit',
      shell: platform() === 'win32',
    });
    desktopProc.on('exit', (code) => {
      if (!shuttingDown) shutdown(code ?? 0);
    });
  })
  .catch((err) => {
    process.stderr.write(`[dev] Web dev server did not become ready within 30 s: ${err.message}\n`);
    process.stderr.write('[dev]    Is Vite still starting, or did it crash? Check output above.\n');
    shutdown(1);
  });
