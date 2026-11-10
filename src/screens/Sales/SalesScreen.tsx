import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AppCard,
  AppIcon,
  EmptyState,
  FilterChips,
  LoadingState,
  ScreenContainer,
  SearchBar,
  StatusBadge,
} from '../../components';
import { Routes } from '../../constants';
import type { Sale, SaleStatus } from '../../database/types';
import { useSales } from '../../hooks/useSales';
import type { SalesStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils';

type Nav = NativeStackNavigationProp<
  SalesStackParamList,
  'Sales'
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

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Draft', value: 'draft' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

type FilterValue = (typeof filterOptions)[number]['value'];

export default function SalesScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();
  const {
    sales,
    isLoading,
    error,
    refreshSales,
  } = useSales();

  const isFocused = useIsFocused();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<FilterValue>('all');

  useEffect(() => {
    if (isFocused) {
      refreshSales();
    }
  }, [isFocused, refreshSales]);

  const filteredSales = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sales.filter(sale => {
      if (
        statusFilter !== 'all' &&
        sale.status !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        String(sale.id).includes(query) ||
        statusLabels[sale.status]
          .toLowerCase()
          .includes(query)
      );
    });
  }, [sales, searchQuery, statusFilter]);

  const renderSale = ({ item }: { item: Sale }) => {
    const isCancelled = item.status === 'cancelled';

    return (
      <AppCard
        style={styles.saleCard}
        onPress={() =>
          navigation.navigate(Routes.SaleDetails, {
            saleId: String(item.id),
          })
        }>
        <View style={styles.saleMain}>
          <Text style={styles.saleNumber}>
            Sale #{item.id}
          </Text>

          <Text style={styles.saleDate}>
            {formatDate(item.sale_date)}
          </Text>
        </View>

        <View style={styles.saleRight}>
          <Text
            style={[
              styles.saleTotal,
              isCancelled && styles.cancelledTotal,
            ]}>
            {formatCurrency(item.total_minor)}
          </Text>

          <StatusBadge
            label={statusLabels[item.status]}
            variant={statusVariants[item.status]}
            style={styles.saleStatusBadge}
          />
        </View>
      </AppCard>
    );
  };

  return (
    <ScreenContainer
      title="Sales"
      scroll={false}
      contentStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions</Text>

        <Pressable
          onPress={() => navigation.navigate(Routes.CreateSale)}
          accessibilityRole="button"
          accessibilityLabel="Record sale"
          style={({ pressed }) => [
            styles.recordSaleButton,
            pressed && styles.recordSaleButtonPressed,
          ]}
        >
          <AppIcon
            name="plus"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.recordSaleLabel}>Record sale</Text>
        </Pressable>
      </View>

      {sales.length > 0 ? (
        <View style={styles.controls}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search sales"
          />

          <FilterChips
            options={filterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </View>
      ) : null}

      {isLoading ? (
        <LoadingState fullscreen />
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load sales"
          message={error}
          actionLabel="Try again"
          onActionPress={refreshSales}
        />
      ) : filteredSales.length === 0 ? (
        <EmptyState
          icon={sales.length > 0 && (searchQuery.trim() || statusFilter !== 'all') ? 'magnify' : 'receipt-text-outline'}
          title={
            sales.length > 0 && (searchQuery.trim() || statusFilter !== 'all')
              ? 'No matching sales'
              : 'No sales yet'
          }
          message={
            sales.length > 0 && (searchQuery.trim() || statusFilter !== 'all')
              ? 'No sales match your current search or status filter.'
              : 'Your recorded sales will appear here.'
          }
          actionLabel={sales.length > 0 ? 'Clear search & filters' : undefined}
          onActionPress={sales.length > 0 ? () => {
            setSearchQuery('');
            setStatusFilter('all');
          } : undefined}
        />
      ) : (
        <FlatList
          data={filteredSales}
          keyExtractor={item => String(item.id)}
          renderItem={renderSale}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshSales}
          refreshing={isLoading}
        />
      )}
    </ScreenContainer>
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
    flex: 1,
  },

  controls: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    flexGrow: 1,
  },

  saleCard: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },

  saleMain: {
    flex: 1,
    minWidth: 0,
  },

  saleNumber: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  saleDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  saleRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    flexShrink: 0,
  },

  saleStatusBadge: {
    alignSelf: 'flex-end',
  },

  saleTotal: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },

  cancelledTotal: {
    color: colors.textMuted,
  },

  sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.sm,
  marginBottom: spacing.md,
},

sectionTitle: {
  ...typography.cardTitle,
  color: colors.textPrimary,
  flexShrink: 1,
},
recordSaleButton: {
  minHeight: 40,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  paddingHorizontal: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  backgroundColor: colors.primaryLight,
},
recordSaleButtonPressed: {
  backgroundColor: colors.primaryLight,
  borderColor: colors.primary,
},

recordSaleLabel: {
  ...typography.label,
  color: colors.primary,
},
});

