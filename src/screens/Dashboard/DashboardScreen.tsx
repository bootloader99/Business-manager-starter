import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View, Pressable
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import {
  AppButton,
  AppCard,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  AppIcon
} from '../../components';
import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils';
import { useDashboard } from '../../hooks/useDashboard';
import { useBusinessProfile } from '../../hooks/useBusinessProfile';
import { Routes } from '../../constants';
import type { MainTabParamList } from '../../navigation/types';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Dashboard'>>();

  const {
    data,
    isLoading,
    error,
    refreshDashboard,
  } = useDashboard();
  const { business, refreshBusiness } = useBusinessProfile();

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
      refreshBusiness();
    }, [refreshDashboard, refreshBusiness]),
  );

  if (isLoading && !data) {
    return (
      <ScreenContainer
        title="Dashboard"
        subtitle="Overview of your business"
      >
        <View style={styles.loading}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            accessibilityLabel="Loading dashboard"
          />
        </View>
      </ScreenContainer>
    );
  }

  if (error && !data) {
    return (
      <ScreenContainer
        title="Dashboard"
        subtitle="Overview of your business"
      >
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to load dashboard"
          message={error}
          actionLabel="Try again"
          onActionPress={refreshDashboard}
        />
      </ScreenContainer>
    );
  }

  if (!data) {
    return null;
  }

  const { stats, recentSales } = data;


const hasRecentActivity = recentSales.length > 0;

  return (
    <ScreenContainer
      title="Dashboard"
      subtitle="Overview of your business"
    >
      {business?.business_name?.trim() ? (
        <View style={styles.businessIdentity}>
          <View style={styles.businessIconContainer}>
            <AppIcon
              name="store-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.businessIdentityText}>
            <Text
              style={styles.businessName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {business.business_name.trim()}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.statsGrid}>
        <StatCard
          label="Today's sales"
          value={formatCurrency(stats.todaySalesMinor)}
          tone="featured"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstandingInvoicesMinor)}
          tone="sage"
        />
        <StatCard
          label="Customers"
          value={String(stats.customerCount)}
        />
      </View>


      <View style={styles.section}>
        <SectionHeader title="Quick actions" />

        <View style={styles.actionRow}>
          <QuickAction
            label="New sale"
            icon="plus-circle"
            onPress={() =>
              navigation.navigate(Routes.SalesTab, {
                screen: Routes.CreateSale,
              })
            }
          />

          <QuickAction
            label="New invoice"
            icon="file-document-outline"
            onPress={() =>
              navigation.navigate(Routes.MoreTab, {
                screen: Routes.CreateInvoice,
                initial: false,
              })
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent sales" />

        {recentSales.length > 0 ? (
          <AppCard style={styles.listCard}>
            {recentSales.map((sale, index) => (
              <View
                key={sale.id}
                style={[
                  styles.listRow,
                  index < recentSales.length - 1 &&
                  styles.listRowBorder,
                ]}
              >
                <View style={styles.listMain}>
                  <Text
                    style={styles.listTitle}
                    numberOfLines={1}
                  >
                    {sale.customerName || 'Walk-in customer'}
                  </Text>

                  <Text style={styles.listMeta}>
                    {sale.saleDate}
                  </Text>
                </View>

                <Text
                  style={styles.listAmount}
                  numberOfLines={1}
                >
                  {formatCurrency(sale.totalMinor)}
                </Text>
              </View>
            ))}
          </AppCard>
        ) : (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No sales yet.
            </Text>
          </AppCard>
        )}
      </View>


      {!hasRecentActivity ? (
        <View style={styles.startMessage}>
          <Text style={styles.startTitle}>
            Ready to get started?
          </Text>

          <Text style={styles.startText}>
            Add your first sale or invoice to see
            activity here.
          </Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'featured' | 'sage' | 'sand';
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return (
    <AppCard
      style={[
        styles.statCard,
        tone === 'featured' && styles.statCardFeatured,
        tone === 'sage' && styles.statCardSage,
        tone === 'sand' && styles.statCardSand,
      ]}
    >
      <Text
        style={[
          styles.statLabel,
          tone === 'featured' && styles.featuredStatText,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.statValue,
          tone === 'featured' && styles.featuredStatText,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </AppCard>
  );
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'plus-circle' | 'file-document-outline' | 'wallet-outline';
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.quickActionPressed,
      ]}
    >
      <View style={styles.quickActionIcon}>
        <AppIcon
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}


const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },

  businessIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    minWidth: 0,
  },

  businessIconContainer: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSage,
  },

  businessIdentityText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  businessName: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 0,
    padding: spacing.md,
  },

  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  statValue: {
    ...typography.metric,
    color: colors.textPrimary,
  },

  statCardFeatured: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  statCardSage: {
    backgroundColor: colors.surfaceSage,
    borderColor: colors.surfaceSage,
  },

  statCardSand: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.surfaceAccent,
  },

  featuredStatText: {
    color: colors.onPrimary,
  },

  section: {
    marginTop: spacing.lg,
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  listCard: {
    paddingVertical: 0,
    overflow: 'hidden',
  },

  listRow: {
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  listRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  listMain: {
    flex: 1,
    minWidth: 0,
  },

  listTitle: {
    ...typography.body,
    fontFamily: typography.label.fontFamily,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  listMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  listAmount: {
    ...typography.body,
    fontFamily: typography.label.fontFamily,
    color: colors.textPrimary,
    flexShrink: 0,
    textAlign: 'right',
  },

  emptyCard: {
    padding: spacing.md,
  },

  emptyText: {
    ...typography.secondary,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  startMessage: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },

  startTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  startText: {
    ...typography.secondary,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  quickActionPressed: {
    backgroundColor: colors.surfaceSage,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  quickAction: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 0,
    minHeight: 92,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  quickActionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSage,
  },

  quickActionLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});

