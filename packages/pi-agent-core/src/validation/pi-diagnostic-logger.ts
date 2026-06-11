import { redactPiDiagnosticValue } from './redaction.js';

export interface PiDiagnosticLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

export function createPiDiagnosticLogEntry(entry: PiDiagnosticLogEntry): PiDiagnosticLogEntry {
  return {
    level: entry.level,
    message: String(redactPiDiagnosticValue(entry.message)),
    data: redactPiDiagnosticValue(entry.data),
  };
}
