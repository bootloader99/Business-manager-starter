import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  AppCard,
  AppIcon,
  EmptyState,
  LoadingState,
  ScreenContainer,
  StatusBadge,
} from '../../components';
import type { MoreStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils';
import {
  getPaymentStatus,
  useInvoices,
  type InvoicePaymentStatus,
  type InvoiceSort,
} from '../../hooks/useInvoices';
import { fontFamily } from '../../theme/typography';

type Props = NativeStackScreenProps<
  MoreStackParamList,
  'Invoices'
>;

type StatusFilter =
  | 'all'
  | 'draft'
  | 'issued'
  | 'cancelled';

type PaymentFilter =
  | 'all'
  | InvoicePaymentStatus;

type StatusOption = {
  value: StatusFilter;
  label: string;
};

type PaymentOption = {
  value: PaymentFilter;
  label: string;
};

const statusOptions: StatusOption[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'cancelled', label: 'Cancelled' },
];

const paymentOptions: PaymentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

const sortOptions: {
  value: InvoiceSort;
  label: string;
}[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'invoice_number', label: 'Invoice number' },
    { value: 'total', label: 'Total' },
  ];

const statusLabels: Record<
  Exclude<StatusFilter, 'all'>,
  string
> = {
  draft: 'Draft',
  issued: 'Issued',
  cancelled: 'Cancelled',
};

const statusVariants: Record<
  Exclude<StatusFilter, 'all'>,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  draft: 'warning',
  issued: 'primary',
  cancelled: 'neutral',
};

const paymentLabels: Record<
  InvoicePaymentStatus,
  string
> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
};

export default function InvoicesScreen({
  navigation,
}: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const {
    invoices,
    isLoading,
    error,
    refreshInvoices,
  } = useInvoices();

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');

  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>('all');

  const [sort, setSort] =
    useState<InvoiceSort>('newest');

  const [showSortOptions, setShowSortOptions] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshInvoices();
    }, [refreshInvoices]),
  );

  const filteredInvoices = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    const result = invoices.filter(
      invoiceData => {
        const invoice =
          invoiceData.invoice;

        const customerName =
          invoiceData.customer?.name ?? '';

        const customerCompany =
          invoiceData.customer?.company_name ?? '';

        const matchesSearch =
          query.length === 0 ||
          invoice.invoice_number
            .toLowerCase()
            .includes(query) ||
          customerName
            .toLowerCase()
            .includes(query) ||
          customerCompany
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === 'all' ||
          invoice.status === statusFilter;

        const paymentStatus =
          getPaymentStatus(
            invoice.paid_minor,
            invoice.total_minor,
          );

        const matchesPayment =
          paymentFilter === 'all' ||
          paymentStatus === paymentFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPayment
        );
      },
    );

    return [...result].sort(
      (a, b) => {
        const invoiceA = a.invoice;
        const invoiceB = b.invoice;

        switch (sort) {
          case 'oldest':
            return (
              new Date(
                invoiceA.issue_date,
              ).getTime() -
              new Date(
                invoiceB.issue_date,
              ).getTime()
            );

          case 'invoice_number':
            return invoiceA.invoice_number.localeCompare(
              invoiceB.invoice_number,
              undefined,
              {
                numeric: true,
                sensitivity: 'base',
              },
            );

          case 'total':
            return (
              invoiceB.total_minor -
              invoiceA.total_minor
            );

          case 'newest':
          default:
            return (
              new Date(
                invoiceB.issue_date,
              ).getTime() -
              new Date(
                invoiceA.issue_date,
              ).getTime()
            );
        }
      },
    );
  }, [
    invoices,
    search,
    statusFilter,
    paymentFilter,
    sort,
  ]);

  if (isLoading && invoices.length === 0) {
    return <LoadingState fullscreen />;
  }

  if (error && invoices.length === 0) {
    return (
      <ScreenContainer
        title="Invoices"
        scroll={false}>
        <View style={styles.errorState}>
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to load invoices"
            message={error}
            actionLabel="Try again"
            onActionPress={refreshInvoices}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Invoices"
    >
      <View style={styles.topControls}>
        <View style={styles.actionRow}>
          <Text style={styles.subtitleText}>
            Manage your invoices
          </Text>

          <Pressable
            onPress={() => navigation.navigate('CreateInvoice')}
            accessibilityRole="button"
            accessibilityLabel="Create invoice"
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
            ]}
          >
            <AppIcon name="plus" size={18} color={colors.primary} />
            <Text style={styles.createButtonText}>Create</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <AppIcon name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search invoices..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search invoices"
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <AppIcon name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionLabel}>
        Status
      </Text>

      <FilterRow
        options={statusOptions}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <Text style={styles.sectionLabel}>
        Payment
      </Text>

      <FilterRow
        options={paymentOptions}
        value={paymentFilter}
        onChange={setPaymentFilter}
      />

      <View style={styles.sortHeader}>
        <Text style={styles.sectionLabel}>
          Invoices
        </Text>

        <Pressable
          onPress={() =>
            setShowSortOptions(
              current => !current,
            )
          }
          style={styles.sortButton}>
          <Text style={styles.sortButtonText}>
            Sort: {getSortLabel(sort)}
          </Text>
        </Pressable>
      </View>

      {showSortOptions ? (
        <View style={styles.sortOptions}>
          {sortOptions.map(option => {
            const selected =
              option.value === sort;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setSort(option.value);
                  setShowSortOptions(false);
                }}
                style={[
                  styles.sortOption,
                  selected &&
                  styles.sortOptionSelected,
                ]}>
                <Text
                  style={[
                    styles.sortOptionText,
                    selected &&
                    styles.sortOptionTextSelected,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={invoices.length === 0 ? 'file-document-outline' : 'magnify'}
          title={
            invoices.length === 0
              ? 'No invoices yet'
              : 'No matching invoices'
          }
          message={
            invoices.length === 0
              ? 'Your invoices will appear here once you create one.'
              : 'No invoices match your current search or filters.'
          }
          actionLabel={invoices.length > 0 ? 'Clear search & filters' : undefined}
          onActionPress={invoices.length > 0 ? () => {
            setSearch('');
            setStatusFilter('all');
            setPaymentFilter('all');
          } : undefined}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={
                isLoading &&
                invoices.length > 0
              }
              onRefresh={refreshInvoices}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.listContent
          }>
          {filteredInvoices.map(
            invoiceData => (
              <InvoiceListCard
                key={
                  invoiceData.invoice.id
                }
                invoiceData={invoiceData}
                onPress={() =>
                  navigation.navigate(
                    'InvoiceDetails',
                    {
                      invoiceId:
                        String(
                          invoiceData.invoice.id,
                        ),
                    },
                  )
                }
              />
            ),
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

type FilterRowProps = {
  options:
  | StatusOption[]
  | PaymentOption[];
  value: string;
  onChange: (value: any) => void;
};

function FilterRow({
  options,
  value,
  onChange,
}: FilterRowProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return (
    <ScrollView
      horizontal
      style={styles.filterScroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContent}
    >
      {options.map(option => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.filterChip,
              selected && styles.filterChipSelected,
              pressed && styles.filterChipPressed,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selected && styles.filterChipTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type InvoiceListCardProps = {
  invoiceData: ReturnType<
    typeof useInvoices
  >['invoices'][number];
  onPress: () => void;
};

function InvoiceListCard({
  invoiceData,
  onPress,
}: InvoiceListCardProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const invoice =
    invoiceData.invoice;

  const paymentStatus =
    getPaymentStatus(
      invoice.paid_minor,
      invoice.total_minor,
    );

  const balanceDue = Math.max(
    invoice.total_minor -
    invoice.paid_minor,
    0,
  );

  return (
    <AppCard
      onPress={onPress}
      style={styles.invoiceCard}>
      <View style={styles.cardHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>
            {invoice.invoice_number}
          </Text>

          <Text style={styles.customerName}>
            {invoiceData.customer?.name ??
              'Walk-in customer'}
          </Text>
        </View>

        <StatusBadge
          label={
            statusLabels[
            invoice.status as Exclude<
              StatusFilter,
              'all'
            >
            ] ?? invoice.status
          }
          variant={
            statusVariants[
            invoice.status as Exclude<
              StatusFilter,
              'all'
            >
            ] ?? 'neutral'
          }
        />
      </View>

      <View style={styles.cardMiddle}>
        <Text style={styles.date}>
          {formatDate(
            invoice.issue_date,
          )}
        </Text>

        <Text style={styles.total}>
          {formatCurrency(
            invoice.total_minor,
          )}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text
          style={[
            styles.paymentStatus,
            paymentStatus === 'paid' &&
            styles.paymentPaid,
            paymentStatus === 'partial' &&
            styles.paymentPartial,
          ]}>
          {paymentLabels[paymentStatus]}
        </Text>

        {paymentStatus !== 'paid' ? (
          <Text style={styles.balance}>
            {formatCurrency(balanceDue)} due
          </Text>
        ) : null}
      </View>
    </AppCard>
  );
}

function getSortLabel(
  value: InvoiceSort,
): string {
  return (
    sortOptions.find(
      option => option.value === value,
    )?.label ?? 'Newest'
  );
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  topControls: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 36,
  },

  subtitleText: {
    ...typography.secondary,
    color: colors.textSecondary,
    flex: 1,
  },
  createButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  createButtonPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  createButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },

  searchContainer: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
  },

  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },

  filterChip: {
    height: 38,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },

  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  filterChipPressed: {
    opacity: 0.75,
  },

  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
  },

  filterChipTextSelected: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },

  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },

  sortButton: {
    paddingVertical: spacing.sm,
  },

  sortButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },

  sortOptions: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },

  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  sortOptionSelected: {
    backgroundColor: colors.primaryLight,
  },

  sortOptionText: {
    ...typography.secondary,
    color: colors.textPrimary,
  },

  sortOptionTextSelected: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },

  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },

  invoiceCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  invoiceInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },

  invoiceNumber: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  customerName: {
    ...typography.secondary,
    color: colors.textSecondary,
    marginTop: 3,
  },

  cardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },

  date: {
    ...typography.caption,
    color: colors.textMuted,
  },

  total: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  paymentStatus: {
    ...typography.caption,
    color: colors.danger,
  },

  paymentPaid: {
    color: colors.success,
  },

  paymentPartial: {
    color: colors.warning,
  },

  balance: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

});

