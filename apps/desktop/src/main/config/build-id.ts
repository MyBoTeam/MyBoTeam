import { execSync } from 'node:child_process';
import { app } from 'electron';
import { getBuildConfig } from './build-config';

let cachedBuildId: string | null = null;

export function getBuildId(): string {
  if (cachedBuildId) return cachedBuildId;

  const fromBuildEnv = getBuildConfig().buildId;
  if (fromBuildEnv) {
    cachedBuildId = fromBuildEnv;
    return cachedBuildId;
  }

  try {
    cachedBuildId = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
    return cachedBuildId;
  } catch {}

  cachedBuildId = app.getVersion();
  return cachedBuildId;
}
