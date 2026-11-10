import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppCard,
  QuantityStepper,
} from '../../../components';
import { spacing, typography, useTheme, type AppTheme } from '../../../theme';
import { formatCurrency } from '../../../utils';

export type TransactionLineItemData = {
  id: string | number;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  taxRate?: number;
  secondaryText?: string;
  footerText?: string;
};

type Props = {
  item: TransactionLineItemData;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function TransactionLineItem({
  item,
  onDecrease,
  onIncrease,
  onRemove,
  disabled = false,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>

          <Text style={styles.meta}>
            {formatCurrency(item.unitPriceMinor)} each
            {item.taxRate && item.taxRate > 0
              ? ` • ${item.taxRate}% tax`
              : ''}
          </Text>

          {item.secondaryText ? (
            <Text style={styles.meta}>
              {item.secondaryText}
            </Text>
          ) : null}
        </View>

        <Text style={styles.total}>
          {formatCurrency(item.totalMinor)}
        </Text>
      </View>

      <View style={styles.footer}>
        <QuantityStepper
          value={item.quantity}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
          min={1}
          disabled={disabled}
        />

        <AppButton
          title="Remove"
          variant="ghost"
          onPress={onRemove}
          disabled={disabled}
          style={styles.removeButton}
        />
      </View>

      {item.footerText ? (
        <Text style={styles.footerText}>
          {item.footerText}
        </Text>
      ) : null}
    </AppCard>
  );
}
const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  info: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },

  name: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  total: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flexShrink: 0,
    textAlign: 'right',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  removeButton: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
});