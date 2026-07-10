import pino from 'pino';

let rootLogger: pino.Logger | null = null;

const SENSITIVE_FIELDS = ['apiKey', 'api_key', 'authorization', 'token', 'secret', 'password'];

function maskValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

/**
 * Performs shallow-only masking of sensitive fields in an object.
 * Does not redact sensitive fields nested within objects or arrays.
 *
 * @param obj - The object to mask sensitive fields in
 * @returns A new object with sensitive fields masked
 */
export function maskSensitiveFields<T extends object>(obj: T): T {
  const masked = { ...obj } as Record<string, unknown>;
  for (const key of SENSITIVE_FIELDS) {
    if (key in masked) {
      masked[key] = maskValue(masked[key]);
    }
  }
  return masked as T;
}

export function getLogger(): pino.Logger {
  if (!rootLogger) {
    const level = process.env.LOG_LEVEL ?? 'info';
    rootLogger = pino({
      level,
      formatters: {
        level: (label) => ({ level: label }),
      },
      serializers: {
        err: pino.stdSerializers.err,
      },
    });
  }
  return rootLogger;
}

export function createChildLogger(bindings: Record<string, unknown>): pino.Logger {
  return getLogger().child(bindings);
}

/**
 * Executes a synchronous operation with timing, logging, and error handling.
 *
 * Logs a debug message on success with duration. Logs a warning if the operation
 * exceeds 100ms (slow query). Logs an error and rethrows on failure.
 *
 * @param logger - The pino logger instance to use
 * @param operation - Name of the operation for log context
 * @param fn - The synchronous function to execute
 * @param context - Optional additional context fields for the log entry
 * @returns The result of the function
 * @throws Re-throws any error thrown by the function
 */
export function logOperation<T>(
  logger: pino.Logger,
  operation: string,
  fn: () => T,
  context?: Record<string, unknown>,
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    if (duration > 100) {
      logger.warn({ operation, duration, ...context }, 'Slow query detected');
    } else {
      logger.debug({ operation, duration, ...context }, 'Operation completed');
    }
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error({ operation, duration, err: error, ...context }, 'Operation failed');
    throw error;
  }
}
