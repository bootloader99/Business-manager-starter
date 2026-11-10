
import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  CurrencyDisplay,
  EmptyState,
  LoadingState,
  ScreenContainer,
  SegmentedControl,
} from '../../components';
import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import {
  type ReportRange,
  useReports,
} from '../../hooks/useReports';

const rangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

function ReportCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return (
    <View style={styles.reportCard}>
      <Text style={styles.reportCardTitle}>{title}</Text>
      <View style={styles.reportCardValue}>{children}</View>
    </View>
  );
}

function StatusRow({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusCount}>{formatNumber(count)}</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [range, setRange] = useState<ReportRange>('month');

  const {
    data,
    loading,
    refreshing,
    error,
    refresh,
  } = useReports(range);

  if (loading && !data) {
    return (
      <ScreenContainer
        title="Reports"
        subtitle="Analytics and exports"
        scroll={false}
        contentStyle={styles.stateContent}
      >
        <LoadingState fullscreen />
      </ScreenContainer>
    );
  }

  if (error && !data) {
    return (
      <ScreenContainer
        title="Reports"
        subtitle="Analytics and exports"
        scroll={false}
        contentStyle={styles.stateContent}
      >
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to load reports"
          message={error}
          actionLabel="Try again"
          onActionPress={refresh}
        />
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer
        title="Reports"
        subtitle="Analytics and exports"
        scroll={false}
        contentStyle={styles.stateContent}
      >
        <EmptyState
          icon="chart-box-outline"
          title="Report data unavailable"
          message="Report data isn't available right now. Try loading it again."
          actionLabel="Try again"
          onActionPress={refresh}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Reports"
      scroll={false}
      contentStyle={styles.screenContent}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.periodSection}>
        
          <Text style={styles.periodLabel}>Reporting period</Text>
          <SegmentedControl
            options={rangeOptions}
            value={range}
            onChange={value => setRange(value)}
          />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              Could not refresh reports. Showing the last loaded data.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales</Text>

          <View style={styles.statsGrid}>
            <ReportCard title="Total sales">
              <CurrencyDisplay
                amountMinor={data.sales.total_minor}
                style={styles.moneyValue}
              />
            </ReportCard>

            <ReportCard title="Transactions">
              <Text style={styles.reportCardNumber}>
                {formatNumber(data.sales.transaction_count)}
              </Text>
            </ReportCard>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average sale</Text>
            <CurrencyDisplay
              amountMinor={data.sales.average_minor}
              style={styles.summaryValue}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoices</Text>

          <View style={styles.statsGrid}>
            <ReportCard title="Invoiced">
              <CurrencyDisplay
                amountMinor={data.invoices.invoiced_minor}
                style={styles.moneyValue}
              />
            </ReportCard>

            <ReportCard title="Outstanding">
              <CurrencyDisplay
                amountMinor={data.invoices.outstanding_minor}
                style={styles.moneyValue}
              />
            </ReportCard>
          </View>

          <View style={styles.statusList}>
            <StatusRow label="Paid" count={data.invoices.paid_count} />
            <View style={styles.statusDivider} />
            <StatusRow
              label="Partial"
              count={data.invoices.partial_count}
            />
            <View style={styles.statusDivider} />
            <StatusRow
              label="Unpaid"
              count={data.invoices.unpaid_count}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments</Text>

          <View style={styles.statsGrid}>
            <ReportCard title="Amount received">
              <CurrencyDisplay
                amountMinor={data.payments.total_minor}
                style={styles.moneyValue}
              />
            </ReportCard>

            <ReportCard title="Payment entries">
              <Text style={styles.reportCardNumber}>
                {formatNumber(data.payments.payment_count)}
              </Text>
            </ReportCard>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Top products & services
          </Text>

          {data.top_products.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                No sales recorded for this period.
              </Text>
            </View>
          ) : (
            <View style={styles.productsCard}>
              {data.top_products.map((product, index) => (
                <View
                  key={`${product.name}-${index}`}
                  style={[
                    styles.productRow,
                    index < data.top_products.length - 1 &&
                    styles.productRowBorder,
                  ]}
                >
                  <View style={styles.productInfo}>
                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>

                    <Text style={styles.productQuantity}>
                      {formatNumber(product.quantity)} sold
                    </Text>
                  </View>

                  <CurrencyDisplay
                    amountMinor={product.total_minor}
                    style={styles.productAmount}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  stateContent: {
    flex: 1,
  },

  screenContent: {
    flex: 1,
    padding: 0,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  periodSection: {
    gap: spacing.sm,
  },

 periodLabel: {
  ...typography.label,
  color: colors.textPrimary,
},

  section: {
    marginTop: spacing.lg,
  },

  sectionTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  reportCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 96,
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  reportCardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  reportCardValue: {
    marginTop: spacing.sm,
  },

  moneyValue: {
    fontFamily: typography.metric.fontFamily,
    fontSize: 17,
    lineHeight: 23,
  },

  reportCardNumber: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },

  summaryLabel: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  summaryValue: {
    ...typography.body,
    fontFamily: typography.label.fontFamily,
  },

  statusList: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  statusDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  statusLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },

  statusCount: {
    ...typography.body,
    fontFamily: typography.label.fontFamily,
    color: colors.textPrimary,
  },

  productsCard: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  productRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    ...typography.body,
    fontFamily: typography.label.fontFamily,
    color: colors.textPrimary,
  },

  productQuantity: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  productAmount: {
    fontFamily: typography.label.fontFamily,
    flexShrink: 0,
  },

  emptySection: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  errorText: {
    ...typography.secondary,
    color: colors.danger,
  },

});


