export function serializeError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error) || 'Unknown error';
}
