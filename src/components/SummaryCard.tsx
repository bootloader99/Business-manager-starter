import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

export type SummaryRow = {
  label: string;
  value: string;
  emphasized?: boolean;
};

type Props = { rows: SummaryRow[] };

export function SummaryCard({ rows }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      {rows.map((row, index) => (
        <React.Fragment key={`${row.label}-${index}`}>
          {index > 0 && row.emphasized ? <View style={[styles.divider, { backgroundColor: palette.border }]} /> : null}
          <View style={styles.row}>
            <Text style={[styles.label, { color: row.emphasized ? palette.textPrimary : palette.textSecondary }, row.emphasized && styles.emphasizedLabel]}>
              {row.label}
            </Text>
            <Text style={[styles.value, { color: palette.textPrimary }, row.emphasized && styles.emphasizedValue]}>
              {row.value}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  label: { ...typography.secondary, flexShrink: 1 },
  value: { ...typography.secondary, fontFamily: typography.label.fontFamily, textAlign: 'right', flexShrink: 0 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
  emphasizedLabel: { ...typography.body, fontFamily: typography.title.fontFamily },
  emphasizedValue: { fontFamily: typography.metric.fontFamily, fontSize: 18, lineHeight: 24, textAlign: 'right', flexShrink: 0 },
});
