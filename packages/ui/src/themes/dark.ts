import { colors } from '../tokens/colors';

export const darkTheme = {
  colors: Object.fromEntries(Object.entries(colors).map(([key, val]) => [key, val.dark])),
};
