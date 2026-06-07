const fs = require('fs');
const path = require('path');
const {
  clearPort,
  formatChildExit,
  killChildProcess,
  killProcessTree,
  resolveExitCode,
  spawnPnpm,
  waitForResources,
} = require('./dev-runtime.cjs');

const args = new Set(process.argv.slice(2));
const isClean = args.has('--clean') || process.env.CLEAN_START === '1';
const isCheck = args.has('--check');
const env = { ...process.env };
if (isClean) {
  env.CLEAN_START = '1';
}

function killExistingDaemon() {
  const daemonDir = path.join(require('os').homedir(), '.myboteam');
  const pidPath = path.join(daemonDir, 'daemon.pid');
  const sockPath = process.platform === 'win32'
    ? null
    : path.join(daemonDir, 'daemon.sock');

  try {
    if (!fs.existsSync(pidPath)) return;
    const content = fs.readFileSync(pidPath, 'utf8');
    const { pid } = JSON.parse(content);
    if (typeof pid === 'number' && pid > 0) {
      try {
        process.kill(pid, 0);
        console.log(`[dev] Stopping existing daemon (pid ${pid})...`);
        killProcessTree(pid, { force: true });
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          try {
            process.kill(pid, 0);
          } catch { break; }
        }
      } catch {}
    }
  } catch {}

  try { fs.unlinkSync(pidPath); } catch {}
  if (sockPath) { try { fs.unlinkSync(sockPath); } catch {} }
}

killExistingDaemon();

const clearedPortCount = clearPort(5173);
if (clearedPortCount > 0) {
  console.log(`[dev] Cleared ${clearedPortCount} process(es) from port 5173`);
}

let web;
let electron;
let shuttingDown = false;

function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;

  killChildProcess(electron, { force: true });
  killChildProcess(web, { force: true });
  clearPort(5173);

  process.exit(resolveExitCode(reason));
}

function handleChildError(label, error) {
  if (shuttingDown) return;
  console.error(`[dev] ${label} failed to start: ${error.message}`);
  shutdown(error);
}

function handleChildExit(label, code, signal) {
  if (shuttingDown) return;
  const message = `[dev] ${label} exited (${formatChildExit(code, signal)})`;
  if (typeof code === 'number' && code === 0) {
    console.log(message);
  } else {
    console.error(message);
  }
  shutdown(typeof code === 'number' ? code : 1);
}

web = spawnPnpm(['-F', '@myboteam/web', 'dev'], { env });
web.on('error', (error) => handleChildError('web dev server', error));
web.on('exit', (code, signal) => handleChildExit('web dev server', code, signal));

waitForResources(['http://localhost:5173'], 30000)
  .then(() => {
    if (shuttingDown) return;

    const electronCommand = isClean ? 'dev:clean' : 'dev';
    const electronArgs = ['-F', '@myboteam/desktop', electronCommand];
    if (isCheck) {
      electronArgs.push('--', '--check');
    }

    electron = spawnPnpm(electronArgs, { env });
    electron.on('error', (error) => handleChildError('desktop dev runtime', error));
    electron.on('exit', (code, signal) => {
      if (shuttingDown) return;
      if (isCheck && code === 0) {
        console.log('[dev] Check mode passed');
        shutdown(0);
        return;
      }
      handleChildExit('desktop dev runtime', code, signal);
    });
  })
  .catch((error) => {
    if (shuttingDown) return;
    console.error(`[dev] Failed waiting for web dev server: ${error.message}`);
    shutdown(error);
  });

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));
process.on('uncaughtException', (error) => {
  console.error(error);
  shutdown(error);
});
process.on('unhandledRejection', (reason) => {
  console.error(reason);
  shutdown(reason);
});
