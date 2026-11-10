import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type Props = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  disabled?: boolean;
};

export function QuantityStepper({ value, onDecrease, onIncrease, min = 1, disabled = false }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const decreaseDisabled = disabled || value <= min;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onDecrease}
        disabled={decreaseDisabled}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        accessibilityState={{ disabled: decreaseDisabled }}
        hitSlop={4}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.primaryLight },
          decreaseDisabled && styles.disabled,
          pressed && !decreaseDisabled && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: palette.primary }]}>−</Text>
      </Pressable>
      <Text style={[styles.value, { color: palette.textPrimary }]} accessibilityLabel={`Quantity: ${value}`}>
        {value}
      </Text>
      <Pressable
        onPress={onIncrease}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        accessibilityState={{ disabled }}
        hitSlop={4}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.primaryLight },
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: palette.primary }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  button: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: typography.body.fontFamily, fontSize: 20, lineHeight: 24, textAlign: 'center' },
  value: { minWidth: 32, textAlign: 'center', ...typography.body, fontFamily: typography.label.fontFamily },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
