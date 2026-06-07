import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { getLogCollector } from '../logging';

export const VERTEX_SA_KEY_FILENAME = 'vertex-sa-key.json';

function logOC(level: 'INFO' | 'WARN', msg: string, data?: Record<string, unknown>) {
  try {
    const l = getLogCollector();
    if (l?.log) {
      l.log(level, 'opencode', msg, data);
    }
  } catch (_e) {}
}

export function cleanupVertexServiceAccountKey(): void {
  try {
    const keyPath = path.join(app.getPath('userData'), VERTEX_SA_KEY_FILENAME);
    if (fs.existsSync(keyPath)) {
      fs.unlinkSync(keyPath);
      logOC('INFO', '[Vertex] Cleaned up service account key file');
    }
  } catch (error) {
    logOC('WARN', '[Vertex] Failed to clean up service account key file', { error: String(error) });
  }
}
