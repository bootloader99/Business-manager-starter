import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  titleNumberOfLines?: number;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  titleNumberOfLines,
}: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const isDisabled = disabled || loading;

  const variantStyle = {
    ...(variant === 'primary' ? { backgroundColor: palette.primary } : {}),
    ...(variant === 'secondary' ? { backgroundColor: palette.primaryLight, borderColor: palette.primaryLight } : {}),
    ...(variant === 'danger' ? { backgroundColor: palette.danger } : {}),
    ...(variant === 'dangerOutline' ? { backgroundColor: palette.surface, borderColor: palette.danger } : {}),
  };
  const textColor = variant === 'primary' ? palette.onPrimary
    : variant === 'secondary' ? palette.primary
    : variant === 'danger' ? palette.white
    : variant === 'dangerOutline' ? palette.danger
    : palette.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' || variant === 'dangerOutline' ? styles.outlined : null,
        variantStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text numberOfLines={titleNumberOfLines} style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: { borderWidth: 1 },
  text: { ...typography.body, fontFamily: typography.label.fontFamily, textAlign: 'center', flexShrink: 1 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
