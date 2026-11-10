import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function DetailSection({ title, children }: DetailSectionProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {children}
      </View>
    </View>
  );
}

type DetailRowProps = {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
};

export function DetailRow({ label, value, multiline = false }: DetailRowProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  if (!value) return null;

  return (
    <View style={[styles.row, multiline && styles.multilineRow, { borderBottomColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: palette.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg },
  title: { ...typography.section, marginBottom: spacing.sm },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  row: {
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  multilineRow: { borderBottomWidth: 0 },
  label: { ...typography.caption, marginBottom: spacing.xs },
  value: { ...typography.body },
});
