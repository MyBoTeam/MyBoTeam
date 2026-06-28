/**
 * Structured logger for daemon RPC server operations.
 * Uses pino for high-performance structured logging.
 *
 * FR-009: Log using a structured logger with configurable levels
 */

import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

export const logger = pino({
  level: LOG_LEVEL,
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino/file',
          options: { destination: 1 }, // stdout
        }
      : undefined,
});

export function createChildLogger(context: string): pino.Logger {
  return logger.child({ context });
}
