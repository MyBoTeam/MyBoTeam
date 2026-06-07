import type { SandboxConfig } from '../../common/types/sandbox.js';
import { DEFAULT_SANDBOX_CONFIG } from '../../common/types/sandbox.js';
import { safeParseJsonWithFallback } from '../../utils/json.js';
import { flushDatabase, getDatabase } from '../database.js';
import { getRow } from './app-settings-common.js';

export function getSandboxConfig(): SandboxConfig {
  const row = getRow();
  const parsed = safeParseJsonWithFallback<Partial<SandboxConfig>>(row.sandbox_config);
  if (
    parsed &&
    (parsed.mode === 'disabled' || parsed.mode === 'native' || parsed.mode === 'docker') &&
    Array.isArray(parsed.allowedPaths) &&
    typeof parsed.networkRestricted === 'boolean' &&
    Array.isArray(parsed.allowedHosts)
  ) {
    return { ...DEFAULT_SANDBOX_CONFIG, ...parsed };
  }
  return { ...DEFAULT_SANDBOX_CONFIG };
}

export function setSandboxConfig(config: SandboxConfig): void {
  const db = getDatabase();
  db.run('UPDATE app_settings SET sandbox_config = ? WHERE id = 1', [JSON.stringify(config)]);
  flushDatabase();
}
