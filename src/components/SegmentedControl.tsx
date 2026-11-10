import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

export type SegmentedControlOption<T extends string> = { label: string; value: T };
type Props<T extends string> = {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.option,
              {
                borderColor: selected ? palette.primary : palette.border,
                backgroundColor: selected ? palette.primaryLight : palette.surface,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.text, { color: selected ? palette.primary : palette.textSecondary }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  text: { ...typography.body, fontFamily: typography.label.fontFamily, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
