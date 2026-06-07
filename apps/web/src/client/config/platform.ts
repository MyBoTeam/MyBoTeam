export function getModifierKeyLabel(): string {
  if (typeof navigator === 'undefined') {
    return 'Alt';
  }
  return /Mac/i.test(navigator.userAgent) ? 'Option' : 'Alt';
}
