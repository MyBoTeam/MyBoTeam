export interface ColorToken {
  variable: string;
  light: string;
  dark: string;
}

export const colorTokens: ColorToken[] = [
  { variable: '--background', light: '60 15% 96.3%', dark: '0 0% 6%' },
  { variable: '--foreground', light: '0 0% 12.5%', dark: '0 0% 95%' },
  { variable: '--card', light: '0 0% 98.8%', dark: '0 0% 11%' },
  { variable: '--card-foreground', light: '0 0% 12.5%', dark: '0 0% 95%' },
  { variable: '--popover', light: '0 0% 98.8%', dark: '0 0% 13%' },
  { variable: '--popover-foreground', light: '0 0% 12.5%', dark: '0 0% 95%' },
  { variable: '--primary', light: '123 30% 20%', dark: '123 30% 45%' },
  { variable: '--primary-foreground', light: '0 0% 100%', dark: '0 0% 9%' },
  { variable: '--secondary', light: '120 14% 85%', dark: '120 10% 20%' },
  { variable: '--secondary-foreground', light: '100 20% 18%', dark: '120 14% 85%' },
  { variable: '--muted', light: '0 0% 93.7%', dark: '0 0% 17%' },
  { variable: '--muted-foreground', light: '0 0% 39.2%', dark: '0 0% 70%' },
  { variable: '--accent', light: '60 15% 96.3%', dark: '0 0% 18%' },
  { variable: '--accent-foreground', light: '0 0% 12.5%', dark: '0 0% 95%' },
  { variable: '--destructive', light: '8 78% 54%', dark: '8 78% 54%' },
  { variable: '--destructive-foreground', light: '0 0% 100%', dark: '0 0% 100%' },
  { variable: '--border', light: '12 8% 90%', dark: '0 0% 22%' },
  { variable: '--input', light: '0 0% 84.7%', dark: '0 0% 25%' },
  { variable: '--ring', light: '20 25% 33%', dark: '20 25% 55%' },
];

export const colors: Record<string, { light: string; dark: string }> = {
  background: { light: '60 15% 96.3%', dark: '0 0% 6%' },
  foreground: { light: '0 0% 12.5%', dark: '0 0% 95%' },
  card: { light: '0 0% 98.8%', dark: '0 0% 11%' },
  'card-foreground': { light: '0 0% 12.5%', dark: '0 0% 95%' },
  popover: { light: '0 0% 98.8%', dark: '0 0% 13%' },
  'popover-foreground': { light: '0 0% 12.5%', dark: '0 0% 95%' },
  primary: { light: '123 30% 20%', dark: '123 30% 45%' },
  'primary-foreground': { light: '0 0% 100%', dark: '0 0% 9%' },
  secondary: { light: '120 14% 85%', dark: '120 10% 20%' },
  'secondary-foreground': { light: '100 20% 18%', dark: '120 14% 85%' },
  muted: { light: '0 0% 93.7%', dark: '0 0% 17%' },
  'muted-foreground': { light: '0 0% 39.2%', dark: '0 0% 70%' },
  accent: { light: '60 15% 96.3%', dark: '0 0% 18%' },
  'accent-foreground': { light: '0 0% 12.5%', dark: '0 0% 95%' },
  destructive: { light: '8 78% 54%', dark: '8 78% 54%' },
  'destructive-foreground': { light: '0 0% 100%', dark: '0 0% 100%' },
  border: { light: '12 8% 90%', dark: '0 0% 22%' },
  input: { light: '0 0% 84.7%', dark: '0 0% 25%' },
  ring: { light: '20 25% 33%', dark: '20 25% 55%' },
};
