export function createIpcListener<T>(
  channel: string,
  callback: (data: T) => void,
  on: (channel: string, listener: (...args: unknown[]) => void) => void,
  off: (channel: string, listener: (...args: unknown[]) => void) => void,
): () => void {
  const listener = (_: unknown, data: unknown) => callback(data as T);
  on(channel, listener);
  return () => off(channel, listener);
}
