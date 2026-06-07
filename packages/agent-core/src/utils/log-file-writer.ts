import fs from 'node:fs';
import path from 'node:path';
import {
  LOG_BUFFER_FLUSH_INTERVAL_MS,
  LOG_BUFFER_MAX_ENTRIES,
  LOG_MAX_FILE_SIZE_BYTES,
  LOG_RETENTION_DAYS,
} from '../common/constants.js';
import type { LogEntry, LogLevel, LogSource } from '../common/types/logging.js';

import { redact } from './redact.js';

export class LogFileWriter {
  private currentDate: string = '';
  private currentFilePath: string = '';
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private fileSizeExceeded: boolean = false;

  constructor(private logDir: string) {}

  initialize(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.cleanupOldLogs();
    this.updateCurrentFile();
    this.flushTimer = setInterval(() => this.flush(), LOG_BUFFER_FLUSH_INTERVAL_MS);
  }

  write(level: LogLevel, source: LogSource, message: string): void {
    if (this.fileSizeExceeded) {
      const today = new Date().toISOString().split('T')[0];
      if (today !== this.currentDate) {
        this.currentDate = today;
        this.currentFilePath = path.join(this.logDir, `app-${today}.log`);
        this.fileSizeExceeded = false;
      } else {
        return;
      }
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message: redact(message),
    };

    this.buffer.push(entry);

    if (this.buffer.length >= LOG_BUFFER_MAX_ENTRIES) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    this.updateCurrentFile();

    if (this.checkFileSize()) {
      this.fileSizeExceeded = true;
      return;
    }

    const lines = this.buffer.map(
      (entry) => `[${entry.timestamp}] [${entry.level}] [${entry.source}] ${entry.message}`,
    );

    try {
      fs.appendFileSync(this.currentFilePath, `${lines.join('\n')}\n`);
      this.buffer = [];
    } catch (_error) {
      if (this.buffer.length > LOG_BUFFER_MAX_ENTRIES * 10) {
        this.buffer = this.buffer.slice(-LOG_BUFFER_MAX_ENTRIES);
      }
    }
  }

  getCurrentLogPath(): string {
    this.updateCurrentFile();
    return this.currentFilePath;
  }

  getLogDir(): string {
    return this.logDir;
  }

  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  private updateCurrentFile(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.currentDate) {
      if (this.currentDate && this.buffer.length > 0 && this.currentFilePath) {
        const lines = this.buffer.map(
          (entry) => `[${entry.timestamp}] [${entry.level}] [${entry.source}] ${entry.message}`,
        );
        try {
          fs.appendFileSync(this.currentFilePath, `${lines.join('\n')}\n`);
          this.buffer = [];
        } catch (_error) {}
      }
      this.currentDate = today;
      this.currentFilePath = path.join(this.logDir, `app-${today}.log`);
      this.fileSizeExceeded = false;
    }
  }

  private checkFileSize(): boolean {
    try {
      if (!fs.existsSync(this.currentFilePath)) return false;
      const stats = fs.statSync(this.currentFilePath);
      return stats.size >= LOG_MAX_FILE_SIZE_BYTES;
    } catch {
      return false;
    }
  }

  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);

      for (const file of files) {
        if (!file.startsWith('app-') || !file.endsWith('.log')) continue;

        const dateMatch = file.match(/app-(\d{4}-\d{2}-\d{2})\.log/);
        if (!dateMatch) continue;

        const fileDate = new Date(dateMatch[1]);
        if (fileDate < cutoffDate) {
          const filePath = path.join(this.logDir, file);
          fs.unlinkSync(filePath);
        }
      }
    } catch (_error) {}
  }
}
