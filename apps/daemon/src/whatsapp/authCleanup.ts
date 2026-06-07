import fs from 'fs';
import { log } from '../logger.js';

export function cleanupAuthState(authStatePath: string): void {
  try {
    if (fs.existsSync(authStatePath)) {
      fs.rmSync(authStatePath, { recursive: true, force: true });
    }
  } catch (err) {
    log.error('[WhatsApp] Failed to cleanup auth state:', err);
  }
}
