type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  time: string;
  msg: string;
  module?: string;
  [key: string]: unknown;
}

class Logger {
  private module: string;
  private level: LogLevel;

  constructor(module: string, level: LogLevel = 'info') {
    this.module = module;
    this.level = level;
  }

  debug(msg: string, data?: Record<string, unknown>): void {
    this.log('debug', msg, data);
  }

  info(msg: string, data?: Record<string, unknown>): void {
    this.log('info', msg, data);
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    this.log('warn', msg, data);
  }

  error(msg: string, data?: Record<string, unknown>): void {
    this.log('error', msg, data);
  }

  child(module: string): Logger {
    return new Logger(`${this.module}.${module}`, this.level);
  }

  private log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      time: new Date().toISOString(),
      msg,
      module: this.module,
      ...data,
    };

    const output = JSON.stringify(entry);

    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export function createChildLogger(module: string, level?: LogLevel): Logger {
  return new Logger(module, level);
}

export type { Logger, LogLevel };
