import type { CreditUsage } from '../../common/types/gateway.js';
import { flushDatabase, getDatabase } from '../database.js';
import { rowFromResult } from '../query-helpers.js';

export function getMyboteamAiCredits(): CreditUsage | null {
  const db = getDatabase();
  const row = rowFromResult<{ credits_json: string }>(
    db.exec('SELECT credits_json FROM myboteam_ai_credits WHERE id = 1'),
  );
  if (!row) return null;
  try {
    return JSON.parse(row.credits_json) as CreditUsage;
  } catch {
    return null;
  }
}

export function saveMyboteamAiCredits(usage: CreditUsage): void {
  const db = getDatabase();
  db.run('INSERT OR REPLACE INTO myboteam_ai_credits (id, credits_json) VALUES (1, ?)', [
    JSON.stringify(usage),
  ]);
  flushDatabase();
}
