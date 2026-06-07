function createLogger(prefix: string) {
  const _fmt = (msg: string) => `[${prefix}] ${msg}`;
  return {
    debug: (_msg: string, ..._args: unknown[]) => {},
    info: (_msg: string, ..._args: unknown[]) => {},
    warn: (_msg: string, ..._args: unknown[]) => {},
    error: (_msg: string, ..._args: unknown[]) => {},
  };
}

export const logger = createLogger('App');
export { createLogger };
