import type { Theme } from '@react-navigation/native';
import type { AppTheme } from '../theme/theme';
import { fontFamily } from '../theme/typography';

export function createNavigationTheme(appTheme: AppTheme, isDark: boolean): Theme {
  return {
    dark: isDark,
    colors: {
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.textPrimary,
      border: appTheme.colors.border,
      notification: appTheme.colors.primary,
    },
    fonts: {
      regular: { fontFamily: fontFamily.regular, fontWeight: '400' },
      medium: { fontFamily: fontFamily.medium, fontWeight: '500' },
      bold: { fontFamily: fontFamily.bold, fontWeight: '700' },
      heavy: { fontFamily: fontFamily.headingBold, fontWeight: '700' },
    },
  };
}

export function createStackScreenOptions(appTheme: AppTheme) {
  return {
    headerShown: false,
    contentStyle: {
      backgroundColor: appTheme.colors.background,
    },
  };
}
