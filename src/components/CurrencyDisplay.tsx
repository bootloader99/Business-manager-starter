import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { typography, useTheme } from '../theme';
import { formatCurrency } from '../utils';

type Props = {
  amountMinor: number;
  currencySymbol?: string;
  decimalPlaces?: number;
  style?: TextStyle;
};

export function CurrencyDisplay({ amountMinor, currencySymbol = '₹', decimalPlaces = 2, style }: Props) {
  const { theme } = useTheme();
  return (
    <Text style={[styles.text, { color: theme.colors.textPrimary }, style]}>
      {formatCurrency(amountMinor, currencySymbol, decimalPlaces)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { ...typography.body },
});
