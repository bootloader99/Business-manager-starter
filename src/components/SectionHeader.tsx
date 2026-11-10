import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel, onActionPress }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: palette.brand }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <AppButton title={actionLabel} onPress={onActionPress} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
  textContainer: { flex: 1, minWidth: 0 },
  title: { ...typography.section },
  subtitle: { ...typography.caption, marginTop: spacing.xs },
  action: { flexShrink: 0 },
});
