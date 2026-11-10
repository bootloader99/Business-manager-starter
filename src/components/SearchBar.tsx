import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <View style={[styles.container, { borderColor: palette.border, backgroundColor: palette.inputBackground }]}>
      <Text style={[styles.icon, { color: palette.textMuted }]} accessible={false}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        style={[styles.input, { color: palette.textPrimary }]}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  icon: {
    fontFamily: typography.body.fontFamily,
    fontSize: 22,
    lineHeight: 26,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
});
