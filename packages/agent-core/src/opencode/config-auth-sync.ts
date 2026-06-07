import fs from 'node:fs';
import path from 'node:path';

import { createConsoleLogger } from '../utils/logging.js';

const log = createConsoleLogger({ prefix: 'OpenCodeConfigAuthSync' });

export const OPENAI_COMPATIBLE_PROVIDER_IDS = [
  'nebius',
  'together',
  'fireworks',
  'groq',
  'venice',
] as const;

const AUTH_KEY_MAPPING: Record<string, string> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google',
  deepseek: 'deepseek',
  zai: 'zai-coding-plan',
  minimax: 'minimax',
  ...Object.fromEntries(OPENAI_COMPATIBLE_PROVIDER_IDS.map((id) => [id, id])),
};

export async function syncApiKeysToOpenCodeAuth(
  authPath: string,
  apiKeys: Record<string, string | null | undefined>,
): Promise<void> {
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

  let updated = false;

  for (const [internalId, authId] of Object.entries(AUTH_KEY_MAPPING)) {
    if (!(internalId in apiKeys)) {
      continue;
    }
    const key = apiKeys[internalId];
    if (key == null) {
      if (auth[authId]) {
        delete auth[authId];
        updated = true;
        log.info(`[OpenCode Auth] Removed ${internalId} API key`);
      }
    } else if (!auth[authId] || auth[authId].key !== key) {
      auth[authId] = { type: 'api', key };
      updated = true;
      log.info(`[OpenCode Auth] Synced ${internalId} API key`);
    }
  }

  if (updated) {
    fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
    log.info(`[OpenCode Auth] Updated auth.json at: ${authPath}`);
  }
}
