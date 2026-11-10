import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

export type FilterChipOption<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  options: readonly FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({ options, value, onChange }: Props<T>) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.chip,
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingVertical: spacing.xs / 2 },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md - 2,
    borderWidth: 1,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { ...typography.secondary, fontFamily: typography.label.fontFamily },
  pressed: { opacity: 0.75 },
});
