import * as fs from 'node:fs';
import { createConsoleLogger } from '../utils/logging.js';
import { getOpenCodeAuthJsonPath } from './auth-paths.js';

export const log = createConsoleLogger({ prefix: 'OpenCodeAuth' });

export interface OpenCodeOauthAuthEntry {
  type?: string;
  refresh?: string;
  access?: string;
  expires?: number;
}

export function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readOpenCodeAuthJson(): Record<string, unknown> | null {
  return readJsonFile(getOpenCodeAuthJsonPath());
}
