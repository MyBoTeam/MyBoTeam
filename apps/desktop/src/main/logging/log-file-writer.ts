import path from 'node:path';
import { createLogWriter, type LogWriterAPI } from '@myboteam/agent-core/desktop-main';
import { app } from 'electron';

export type { LogEntry, LogLevel, LogSource } from '@myboteam/agent-core/desktop-main';

let instance: LogWriterAPI | null = null;

export function getLogFileWriter(): LogWriterAPI {
  if (!instance) {
    const userDataPath = app.getPath('userData');
    const logDir = path.join(userDataPath, 'logs');
    instance = createLogWriter({ logDir });
  }
  return instance;
}

export function initializeLogFileWriter(): void {
  getLogFileWriter().initialize();
}

export function shutdownLogFileWriter(): void {
  if (instance) {
    instance.shutdown();
    instance = null;
  }
}
