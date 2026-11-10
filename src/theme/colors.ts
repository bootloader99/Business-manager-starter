import { Appearance } from 'react-native';
import { appConfig } from '../config/appConfig';

export const lightColors = {
  brand: appConfig.theme.brand,
  primary: appConfig.theme.primary,
  primaryDark: appConfig.theme.primaryDark,
  primaryLight: appConfig.theme.primaryLight,
  primaryPressed: '#112D25',
  onPrimary: '#F4F0E6',
  headerBackground: '#F4F0E6',
  headerForeground: '#183D32',
  headerDivider: '#E4DED0',

  background: '#F4F0E6',
  surface: '#FFFEFA',
  surfaceElevated: '#FFFEFA',
  surfaceSage: '#DCE6D9',
  surfaceAccent: '#E6D8BA',
  inputBackground: '#FFFEFA',
  textPrimary: '#252C27',
  textSecondary: '#74796F',
  textMuted: '#74796F',
  placeholder: '#74796F',
  border: '#E4DED0',
  divider: '#E4DED0',
  disabled: '#96978F',
  disabledSurface: '#EAE7DF',
  disabledText: '#96978F',

  success: '#27735A',
  successLight: '#E4F0E8',
  warning: '#986B25',
  warningLight: '#F5EBD5',
  danger: '#B65D49',
  dangerLight: '#F6E5DF',
  error: '#B65D49',
  errorLight: '#F6E5DF',
  info: '#183D32',
  infoLight: '#DCE6D9',

  tabInactive: '#74796F',
  white: '#FFFEFA',
} as const;

export const darkColors = {
  brand: '#6D9B7B',
  primary: '#6D9B7B',
  primaryDark: '#557E63',
  primaryLight: '#2B3B30',
  primaryPressed: '#557E63',
  onPrimary: '#111A16',
  headerBackground: '#111A16',
  headerForeground: '#F4F0E6',
  headerDivider: '#35443A',

  background: '#111A16',
  surface: '#1B2922',
  surfaceElevated: '#24352B',
  surfaceSage: '#2B3B30',
  surfaceAccent: '#2B3B30',
  inputBackground: '#1B2922',
  textPrimary: '#F4F0E6',
  textSecondary: '#B3BCAF',
  textMuted: '#B3BCAF',
  placeholder: '#B3BCAF',
  border: '#35443A',
  divider: '#35443A',
  disabled: '#818A80',
  disabledSurface: '#29332C',
  disabledText: '#818A80',

  success: '#73B798',
  successLight: '#243D32',
  warning: '#E0B66C',
  warningLight: '#403723',
  danger: '#E18A76',
  dangerLight: '#442E2A',
  error: '#E18A76',
  errorLight: '#442E2A',
  info: '#9BBCA4',
  infoLight: '#2B3B30',

  tabInactive: '#B3BCAF',
  white: '#F4F0E6',
} as const;

// Static fallback for module-level constants. Use useTheme() for palette values
// that must react to appearance changes.
export const colors =
  Appearance.getColorScheme() === 'dark' ? darkColors : lightColors;
