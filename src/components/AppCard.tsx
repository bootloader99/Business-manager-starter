import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, useTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
};

export function AppCard({
  children,
  style,
  onPress,
  disabled = false,
}: Props) {
  const { theme } = useTheme();
  const themeCardStyle = { backgroundColor: theme.colors.surface, borderColor: theme.colors.border };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.card,
          themeCardStyle,
          style,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, themeCardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
  },

  pressed: {
    opacity: 0.75,
  },

  disabled: {
    opacity: 0.55,
  },
});