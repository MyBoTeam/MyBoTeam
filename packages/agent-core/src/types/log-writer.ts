import type { LogLevel, LogSource } from '../common/types/logging.js';

export type { LogEntry, LogLevel, LogSource } from '../common/types/logging.js';

export interface LogWriterOptions {
  logDir: string;

  maxFileSizeBytes?: number;

  retentionDays?: number;

  bufferFlushIntervalMs?: number;

  bufferMaxEntries?: number;
}

export interface LogWriterAPI {
  initialize(): void;

  write(level: LogLevel, source: LogSource, message: string): void;

  log(level: LogLevel, source: LogSource, message: string, data?: unknown): void;

  logMcp(level: LogLevel, message: string, data?: unknown): void;

  logBrowser(level: LogLevel, message: string, data?: unknown): void;

  logOpenCode(level: LogLevel, message: string, data?: unknown): void;

  logEnv(level: LogLevel, message: string, data?: unknown): void;

  logIpc(level: LogLevel, message: string, data?: unknown): void;

  flush(): void;

  getCurrentLogPath(): string;

  getLogDir(): string;

  shutdown(): void;
}
