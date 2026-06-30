import { closeSync, mkdirSync, openSync, readFileSync, unlinkSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createChildLogger } from './logger.js';

const log = createChildLogger('agent-pids');

export function saveAgentPids(dataDir: string, pids: number[]): void {
  const pidFilePath = join(dataDir, 'agent.pids');
  const dir = dirname(pidFilePath);
  mkdirSync(dir, { recursive: true });
  const fd = openSync(pidFilePath, 'w', 0o600);
  try {
    writeSync(fd, JSON.stringify(pids), 0, 'utf-8');
  } finally {
    closeSync(fd);
  }
}

export function cleanupAgentProcesses(dataDir: string): number {
  const pidFilePath = join(dataDir, 'agent.pids');
  let cleaned = 0;

  try {
    const raw = readFileSync(pidFilePath, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      log.warn('Agent PIDs file contained non-array data, skipping cleanup');
      return cleaned;
    }

    for (const pid of parsed) {
      if (typeof pid !== 'number' || !Number.isFinite(pid) || pid <= 0 || !Number.isInteger(pid)) {
        log.warn(`Skipping invalid PID entry: ${pid}`);
        continue;
      }
      try {
        process.kill(pid, 'SIGTERM');
        cleaned++;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code && code !== 'ESRCH' && code !== 'EPERM') {
          log.warn(`Failed to terminate agent process ${pid}: ${code}`);
        }
      }
    }

    if (cleaned > 0) {
      log.info(`Sent SIGTERM to ${cleaned} agent process(es)`);
    }
    unlinkSync(pidFilePath);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code && code !== 'ENOENT') {
      log.warn(`Failed to read agent PIDs file: ${code}`);
    }
  }

  return cleaned;
}
