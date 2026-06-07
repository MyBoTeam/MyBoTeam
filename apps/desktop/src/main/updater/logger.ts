import { getLogCollector } from '../logging';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export function log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
  try {
    getLogCollector()?.log?.(level, 'main', msg, data);
  } catch {}
}
