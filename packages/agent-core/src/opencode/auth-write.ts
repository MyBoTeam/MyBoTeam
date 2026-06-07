import * as fs from 'node:fs';
import * as path from 'node:path';
import { log } from './auth-common.js';
import { getOpenCodeAuthPath } from './auth-paths.js';

export function writeOpenCodeAuth(
  providerKeys: Record<string, { type: string; key: string }>,
): void {
  const authPath = getOpenCodeAuthPath();
  const authDir = path.dirname(authPath);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  let auth: Record<string, { type: string; key: string }> = {};
  if (fs.existsSync(authPath)) {
    try {
      auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    } catch (_e) {
      log.warn('[OpenCode Auth] Failed to parse existing auth.json, creating new one');
      auth = {};
    }
  }

  for (const [providerId, entry] of Object.entries(providerKeys)) {
    auth[providerId] = entry;
  }

  fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
  log.info(`[OpenCode Auth] Updated auth.json at: ${authPath}`);
}
