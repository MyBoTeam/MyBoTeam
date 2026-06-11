import { colors } from '../tokens/colors';

export const lightTheme = {
  colors: Object.fromEntries(Object.entries(colors).map(([key, val]) => [key, val.light])),
};
