export interface ColorToken {
  variable: string;
  light: string;
  dark: string;
}

export const colorTokens: ColorToken[] = [
  { variable: '--background', light: 'oklch(1 0 0)', dark: 'oklch(0.145 0 0)' },
  { variable: '--foreground', light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
  { variable: '--card', light: 'oklch(1 0 0)', dark: 'oklch(0.205 0 0)' },
  { variable: '--card-foreground', light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
  { variable: '--popover', light: 'oklch(1 0 0)', dark: 'oklch(0.205 0 0)' },
  { variable: '--popover-foreground', light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
  { variable: '--primary', light: 'oklch(0.205 0 0)', dark: 'oklch(0.922 0 0)' },
  { variable: '--primary-foreground', light: 'oklch(0.985 0 0)', dark: 'oklch(0.205 0 0)' },
  { variable: '--secondary', light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
  { variable: '--secondary-foreground', light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
  { variable: '--muted', light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
  { variable: '--muted-foreground', light: 'oklch(0.556 0 0)', dark: 'oklch(0.708 0 0)' },
  { variable: '--accent', light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
  { variable: '--accent-foreground', light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
  {
    variable: '--destructive',
    light: 'oklch(0.577 0.245 27.325)',
    dark: 'oklch(0.704 0.191 22.216)',
  },
  { variable: '--border', light: 'oklch(0.922 0 0)', dark: 'oklch(1 0 0 / 10%)' },
  { variable: '--input', light: 'oklch(0.922 0 0)', dark: 'oklch(1 0 0 / 15%)' },
  { variable: '--ring', light: 'oklch(0.708 0 0)', dark: 'oklch(0.556 0 0)' },
];

export const colors: Record<string, { light: string; dark: string }> = {
  background: { light: 'oklch(1 0 0)', dark: 'oklch(0.145 0 0)' },
  foreground: { light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
  card: { light: 'oklch(1 0 0)', dark: 'oklch(0.205 0 0)' },
  'card-foreground': { light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
  popover: { light: 'oklch(1 0 0)', dark: 'oklch(0.205 0 0)' },
  'popover-foreground': { light: 'oklch(0.145 0 0)', dark: 'oklch(0.985 0 0)' },
  primary: { light: 'oklch(0.205 0 0)', dark: 'oklch(0.922 0 0)' },
  'primary-foreground': { light: 'oklch(0.985 0 0)', dark: 'oklch(0.205 0 0)' },
  secondary: { light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
  'secondary-foreground': { light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
  muted: { light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
  'muted-foreground': { light: 'oklch(0.556 0 0)', dark: 'oklch(0.708 0 0)' },
  accent: { light: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
  'accent-foreground': { light: 'oklch(0.205 0 0)', dark: 'oklch(0.985 0 0)' },
  destructive: { light: 'oklch(0.577 0.245 27.325)', dark: 'oklch(0.704 0.191 22.216)' },
  border: { light: 'oklch(0.922 0 0)', dark: 'oklch(1 0 0 / 10%)' },
  input: { light: 'oklch(0.922 0 0)', dark: 'oklch(1 0 0 / 15%)' },
  ring: { light: 'oklch(0.708 0 0)', dark: 'oklch(0.556 0 0)' },
};
