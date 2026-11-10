import { darkColors, lightColors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

export const lightTheme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
} as const;

export const darkTheme = {
  colors: darkColors,
  spacing,
  radius,
  typography,
} as const;

export type AppTheme = {
  colors: typeof lightColors | typeof darkColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};
