import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
};

export function AppSelectField({
  label,
  value,
  placeholder = 'Select...',
  onPress,
}: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const hasValue = value.length > 0;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: palette.textPrimary }]}>{label}</Text>
      ) : null}

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${hasValue ? value : placeholder}` : hasValue ? value : placeholder}
        style={({ pressed }) => [
          styles.container,
          { borderColor: palette.border, backgroundColor: palette.inputBackground },
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[styles.value, { color: hasValue ? palette.textPrimary : palette.textMuted }]}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder}
        </Text>
        <Text style={[styles.chevron, { color: palette.textMuted }]} accessible={false}>
          ›
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  container: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  value: { flex: 1, ...typography.body },
  chevron: {
    fontFamily: typography.body.fontFamily,
    fontSize: 24,
    lineHeight: 28,
    marginLeft: spacing.sm,
  },
  pressed: { opacity: 0.75 },
});
