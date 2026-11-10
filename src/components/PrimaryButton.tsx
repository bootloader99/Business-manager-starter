import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const primary = variant === 'primary';

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: primary ? palette.primary : palette.surface,
          borderColor: primary ? palette.primary : palette.border,
          borderWidth: primary ? 0 : 1,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: primary ? palette.onPrimary : palette.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
  label: { ...typography.label },
});
