/**
 * Log levels for daemon lifecycle logging
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Structured JSON Logger for daemon lifecycle events
 */
export class Logger {
  private context: string;
  private correlationId: string;

  constructor(context: string, correlationId?: string) {
    this.context = context;
    this.correlationId = correlationId ?? this.generateCorrelationId();
  }

  /**
   * Log a DEBUG message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log an INFO message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log a WARN message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log an ERROR message
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Log a structured entry
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      correlationId: this.correlationId,
      metadata,
    };

    // Output as JSON to stdout
    try {
      process.stdout.write(`${JSON.stringify(entry)}\n`);
    } catch {
      process.stdout.write(
        `${JSON.stringify({
          ...entry,
          metadata: { serializationError: true },
        })}\n`,
      );
    }
  }

  /**
   * Generate a unique correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get the current correlation ID
   */
  getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Create a child logger with the same correlation ID
   */
  child(context: string): Logger {
    return new Logger(context, this.correlationId);
  }
}
