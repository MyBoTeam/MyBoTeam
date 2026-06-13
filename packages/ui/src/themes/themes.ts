export interface ThemeColors {
  primary: string;
  'primary-foreground': string;
  accent: string;
  'accent-foreground': string;
  ring: string;
  'theme-bg-gradient': string;
}

export interface ThemeDefinition {
  name: string;
  className: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export const themeDefinitions: ThemeDefinition[] = [
  {
    name: 'Mint',
    className: 'theme-mint',
    light: {
      primary: '163 54% 42%',
      'primary-foreground': '0 0% 100%',
      accent: '163 40% 90%',
      'accent-foreground': '163 54% 20%',
      ring: '163 54% 42%',
      'theme-bg-gradient': 'linear-gradient(135deg, #a3e7d3 0%, #53d3b1 100%)',
    },
    dark: {
      primary: '163 54% 55%',
      'primary-foreground': '0 0% 8%',
      accent: '163 30% 18%',
      'accent-foreground': '163 40% 80%',
      ring: '163 54% 55%',
      'theme-bg-gradient': 'linear-gradient(135deg, #1a3d33 0%, #0d2620 100%)',
    },
  },
  {
    name: 'Blue',
    className: 'theme-blue',
    light: {
      primary: '221 56% 55%',
      'primary-foreground': '0 0% 100%',
      accent: '221 56% 92%',
      'accent-foreground': '221 56% 20%',
      ring: '221 56% 55%',
      'theme-bg-gradient': 'linear-gradient(135deg, #b9daff 0%, #7fb9ff 100%)',
    },
    dark: {
      primary: '221 56% 65%',
      'primary-foreground': '0 0% 8%',
      accent: '221 30% 18%',
      'accent-foreground': '221 40% 80%',
      ring: '221 56% 65%',
      'theme-bg-gradient': 'linear-gradient(135deg, #1a2740 0%, #0d1830 100%)',
    },
  },
  {
    name: 'Lemon',
    className: 'theme-lemon',
    light: {
      primary: '66 72% 40%',
      'primary-foreground': '0 0% 100%',
      accent: '66 72% 90%',
      'accent-foreground': '66 72% 20%',
      ring: '66 72% 40%',
      'theme-bg-gradient': 'linear-gradient(135deg, #ffffb3 0%, #e6ff66 100%)',
    },
    dark: {
      primary: '66 72% 55%',
      'primary-foreground': '0 0% 8%',
      accent: '66 40% 18%',
      'accent-foreground': '66 50% 80%',
      ring: '66 72% 55%',
      'theme-bg-gradient': 'linear-gradient(135deg, #3d3d1a 0%, #26260d 100%)',
    },
  },
  {
    name: 'Peach',
    className: 'theme-peach',
    light: {
      primary: '0 56% 58%',
      'primary-foreground': '0 0% 100%',
      accent: '0 56% 92%',
      'accent-foreground': '0 56% 20%',
      ring: '0 56% 58%',
      'theme-bg-gradient': 'linear-gradient(135deg, #ffd0b3 0%, #ffa07a 100%)',
    },
    dark: {
      primary: '0 56% 68%',
      'primary-foreground': '0 0% 8%',
      accent: '0 30% 18%',
      'accent-foreground': '0 40% 80%',
      ring: '0 56% 68%',
      'theme-bg-gradient': 'linear-gradient(135deg, #3d241a 0%, #26180d 100%)',
    },
  },
  {
    name: 'Lavender',
    className: 'theme-lavender',
    light: {
      primary: '248 74% 63%',
      'primary-foreground': '0 0% 100%',
      accent: '248 74% 92%',
      'accent-foreground': '248 74% 20%',
      ring: '248 74% 63%',
      'theme-bg-gradient': 'linear-gradient(135deg, #dcd3ff 0%, #b3a3ff 100%)',
    },
    dark: {
      primary: '248 74% 73%',
      'primary-foreground': '0 0% 8%',
      accent: '248 30% 18%',
      'accent-foreground': '248 50% 80%',
      ring: '248 74% 73%',
      'theme-bg-gradient': 'linear-gradient(135deg, #2a1a3d 0%, #1a0d26 100%)',
    },
  },
  {
    name: 'Neutral',
    className: 'theme-neutral',
    light: {
      primary: '220 9% 46%',
      'primary-foreground': '0 0% 100%',
      accent: '220 9% 93%',
      'accent-foreground': '220 9% 30%',
      ring: '220 9% 46%',
      'theme-bg-gradient': '#ffffff',
    },
    dark: {
      primary: '220 9% 56%',
      'primary-foreground': '0 0% 100%',
      accent: '220 9% 18%',
      'accent-foreground': '220 9% 80%',
      ring: '220 9% 56%',
      'theme-bg-gradient': 'linear-gradient(135deg, #1f1f1f 0%, #141414 100%)',
    },
  },
];
