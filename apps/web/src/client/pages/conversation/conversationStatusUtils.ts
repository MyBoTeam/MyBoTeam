export function getStatusTranslationKey(rawStatus: string): string {
  if (rawStatus === 'interrupted') {
    return 'status.stopped';
  }
  return `status.${rawStatus}`;
}
