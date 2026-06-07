const COORDINATE_CLICK_APP_NAMES = new Set([
  'Google Docs',
  'Google Sheets',
  'Google Slides',
  'Gmail',
  'Google Drive',
  'Figma',
  'Canva',
  'Miro',
]);

export function shouldUseCoordinateClick(_url: string, appName: string | null): boolean {
  if (!appName) {
    return false;
  }
  return COORDINATE_CLICK_APP_NAMES.has(appName);
}
