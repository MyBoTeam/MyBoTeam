/**
 * Thin structured logger for the web renderer.
 *
 * Wraps console methods with a consistent prefix so log output
 * is uniform and easy to grep. Swap implementation here if a
 * remote/structured sink is added later.
 */

function createLogger(prefix: string) {
  const _fmt = (msg: string) => `[${prefix}] ${msg}`;
  return {
    debug: (_msg: string, ..._args: unknown[]) => {},
    info: (_msg: string, ..._args: unknown[]) => {},
    warn: (_msg: string, ..._args: unknown[]) => {},
    error: (_msg: string, ..._args: unknown[]) => {},
  };
}

/** Default app-level logger. Import and use directly, or call createLogger() for a scoped one. */
export const logger = createLogger('App');
export { createLogger };
