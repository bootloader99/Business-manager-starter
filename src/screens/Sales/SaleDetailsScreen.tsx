import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  ConfirmationModal,
  DetailRow,
  DetailSection,
  EmptyState,
  LoadingState,
  ScreenContainer,
  StatusBadge,
  SummaryCard,
  useAppToast,
} from '../../components';
import {
  getSaleById,
  updateSaleStatus,
} from '../../database/repositories/saleRepository';
import type {
  Sale,
  SaleItem,
  SaleStatus,
} from '../../database/types';
import type { SalesStackParamList } from '../../navigation/types';
import { spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils';
import { fontFamily } from '../../theme/typography';

type Props = NativeStackScreenProps<
  SalesStackParamList,
  'SaleDetails'
>;

type Nav = NativeStackNavigationProp<
  SalesStackParamList,
  'SaleDetails'
>;

const statusLabels: Record<SaleStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusVariants: Record<
  SaleStatus,
  'warning' | 'success' | 'danger'
> = {
  draft: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export default function SaleDetailsScreen({
  route,
}: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();

  const saleId = Number(route.params.saleId);

  const [showCancelConfirmation, setShowCancelConfirmation] =
    useState(false);

  const { showToast } = useAppToast();

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadSale = async () => {
      setIsLoading(true);

      try {
        setError(null);

        const result = await getSaleById(saleId);

        if (!result) {
          setSale(null);
          setItems([]);
          setError('Sale not found.');
          return;
        }

        setSale(result.sale);
        setItems(result.items);
      } catch (err) {
        console.error('Failed to load sale:', err);
        setError('Unable to load sale.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSale();
  }, [saleId, isFocused]);

  const handleCancelSale = () => {
    if (!sale || sale.status === 'cancelled' || isUpdating) {
      return;
    }

    setShowCancelConfirmation(true);
  };

  const handleConfirmCancelSale = async () => {
    if (!sale || sale.status === 'cancelled' || isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);

      await updateSaleStatus(sale.id, 'cancelled');

      setSale(current =>
        current
          ? { ...current, status: 'cancelled' }
          : current,
      );

      setShowCancelConfirmation(false);
    } catch (err) {
      console.error('Failed to cancel sale:', err);

      setShowCancelConfirmation(false);

      showToast({
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong while cancelling the sale.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingState fullscreen />;
  }

  if (error || !sale) {
    return (
      <ScreenContainer
        title="Sale"
        scroll={false}>
        <EmptyState
          title="Sale unavailable"
          message={
            error ?? 'This sale could not be found.'
          }
          actionLabel="Go back"
          onActionPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  const isCancelled = sale.status === 'cancelled';

  return (
    <>
      <ScreenContainer
        title={`Sale #${sale.id}`}
        subtitle={formatDate(sale.sale_date)}
        contentStyle={styles.content}>
        <View style={styles.headerRow}>
          <StatusBadge
            label={statusLabels[sale.status]}
            variant={statusVariants[sale.status]}
          />
        </View>

        <AppCard style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>

          <Text
            style={[
              styles.total,
              isCancelled && styles.cancelledTotal,
            ]}>
            {formatCurrency(sale.total_minor)}
          </Text>
        </AppCard>

        <DetailSection title="Items">
          {items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.name}
                </Text>

                <Text style={styles.itemMeta}>
                  {formatCurrency(item.unit_price_minor)}
                  {' × '}
                  {item.quantity}
                  {item.tax_rate > 0
                    ? ` • ${item.tax_rate}% tax`
                    : ''}
                </Text>
              </View>

              <Text style={styles.itemTotal}>
                {formatCurrency(item.total_minor)}
              </Text>
            </View>
          ))}
        </DetailSection>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <SummaryCard
            rows={[
              {
                label: 'Subtotal',
                value: formatCurrency(
                  sale.subtotal_minor,
                ),
              },
              {
                label: 'Tax',
                value: formatCurrency(sale.tax_minor),
              },
              {
                label: 'Discount',
                value: `-${formatCurrency(
                  sale.discount_minor,
                )}`,
              },
              {
                label: 'Total',
                value: formatCurrency(sale.total_minor),
                emphasized: true,
              },
            ]}
          />
        </View>

        {sale.notes ? (
          <DetailSection title="Notes">
            <DetailRow
              label="Notes"
              value={sale.notes}
              multiline
            />
          </DetailSection>
        ) : null}

        {!isCancelled ? (
          <AppButton
            title="Cancel sale"
            variant="danger"
            onPress={handleCancelSale}
            loading={isUpdating}
            disabled={isUpdating}
            style={styles.cancelButton}
          />
        ) : null}
      </ScreenContainer>
      <ConfirmationModal
        visible={showCancelConfirmation}
        title="Cancel sale?"
        message="This will cancel the sale and restore any tracked product stock."
        confirmLabel="Cancel sale"
        cancelLabel="Keep sale"
        destructive
        loading={isUpdating}
        onConfirm={handleConfirmCancelSale}
        onCancel={() => {
          if (!isUpdating) {
            setShowCancelConfirmation(false);
          }
        }}
      />
    </>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  totalLabel: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  total: {
    fontFamily: typography.title.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  cancelledTotal: {
    color: colors.textMuted,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  itemRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    ...typography.body,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  itemTotal: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flexShrink: 0,
  },
  cancelButton: {
    marginTop: spacing.xl,
  },
});

