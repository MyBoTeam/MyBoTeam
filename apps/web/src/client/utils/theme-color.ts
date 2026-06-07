export const COLOR_THEME_KEY = 'theme-color';

export const VALID_COLORS = ['mint', 'blue', 'lemon', 'peach', 'lavender', 'neutral'] as const;

export type ThemeColor = (typeof VALID_COLORS)[number];

export const COLOR_CLASSES = [
  'theme-mint',
  'theme-blue',
  'theme-lemon',
  'theme-peach',
  'theme-lavender',
  'theme-neutral',
] as const;

export function isValidColor(value: string): value is ThemeColor {
  return (VALID_COLORS as readonly string[]).includes(value);
}

export function applyColorTheme(color: string): void {
  const html = document.documentElement;
  html.classList.remove(...COLOR_CLASSES);
  if (color && isValidColor(color)) {
    html.classList.add(`theme-${color}`);
  }
}
