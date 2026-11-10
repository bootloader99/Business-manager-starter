import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { typography, useTheme } from '../theme';

type Props = { value: string; style?: TextStyle };

export function DateDisplay({ value, style }: Props) {
  const { theme } = useTheme();
  return (
    <Text style={[styles.text, { color: theme.colors.textSecondary }, style]}>
      {formatDisplayDate(value)}
    </Text>
  );
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  text: { ...typography.secondary },
});
