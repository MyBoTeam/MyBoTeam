import type { LogWriterAPI } from '@myboteam/agent-core/desktop-main';
import { getLogFileWriter, shutdownLogFileWriter } from './log-file-writer';

export type { LogLevel, LogSource } from '@myboteam/agent-core/desktop-main';

let instance: LogWriterAPI | null = null;

export function getLogCollector(): LogWriterAPI {
  if (!instance) {
    instance = getLogFileWriter();
  }
  return instance;
}

export function initializeLogCollector(): void {
  getLogCollector().initialize();
}

export function shutdownLogCollector(): void {
  if (instance) {
    instance.shutdown();
    instance = null;
  }

  shutdownLogFileWriter();
}
