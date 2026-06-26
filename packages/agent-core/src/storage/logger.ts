import pino from 'pino';

let rootLogger: pino.Logger | null = null;

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
