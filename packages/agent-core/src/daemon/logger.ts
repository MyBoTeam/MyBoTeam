/**
 * Daemon Logger
 *
 * Lightweight structured logger for daemon internals.
 * Wraps console methods with a consistent prefix / level format.
 *
 * ESM module — use .js extensions on imports.
 */

export interface DaemonLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

function createLogger(namespace: string): DaemonLogger {
  const _prefix = `[${namespace}]`;
  return {
    info: (_message: string, ..._args: unknown[]) => {},
    warn: (_message: string, ..._args: unknown[]) => {},
    error: (_message: string, ..._args: unknown[]) => {},
    debug: (_message: string, ..._args: unknown[]) => {
      if (process.env.DEBUG) {
      }
    },
  };
}

export { createLogger };

/** Shared daemon logger instance. */
export const logger = createLogger('Daemon');
