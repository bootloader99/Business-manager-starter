import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

type Props = {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
};

export function StatusBadge({ label, variant = 'neutral', style }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const backgroundColor = variant === 'primary' ? palette.primaryLight
    : variant === 'success' ? palette.successLight
    : variant === 'warning' ? palette.warningLight
    : variant === 'danger' ? palette.dangerLight
    : palette.disabledSurface;
  const textColor = variant === 'primary' ? palette.primary
    : variant === 'success' ? palette.success
    : variant === 'warning' ? palette.warning
    : variant === 'danger' ? palette.danger
    : palette.textSecondary;

  return (
    <View style={[styles.base, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  text: { ...typography.caption, fontFamily: typography.label.fontFamily },
});
