export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogSource = 'main' | 'mcp' | 'browser' | 'opencode' | 'env' | 'ipc' | 'daemon';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
}
