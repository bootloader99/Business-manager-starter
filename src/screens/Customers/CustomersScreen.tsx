import {
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppCard,
  AppIcon,
  EmptyState,
  LoadingState,
  ScreenContainer,
  SearchBar,
} from '../../components';
import { Routes } from '../../constants';
import { useCustomers } from '../../hooks/useCustomers';
import type { CustomersStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { fontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<
  CustomersStackParamList,
  'Customers'
>;

export default function CustomersScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();

  const {
    customers,
    isLoading,
    error,
    refreshCustomers,
  } = useCustomers();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isFocused) {
      refreshCustomers();
    }
  }, [isFocused, refreshCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter(customer =>
      [
        customer.name,
        customer.company_name,
        customer.phone,
        customer.email,
      ].some(value =>
        value?.toLowerCase().includes(query),
      ),
    );
  }, [customers, searchQuery]);

  const handleAddCustomer = () => {
    navigation.navigate(Routes.CustomerForm, {});
  };

  const renderCustomer = ({
    item,
  }: {
    item: (typeof customers)[number];
  }) => (
    <Pressable
      onPress={() =>
        navigation.navigate(
          Routes.CustomerDetails,
          {
            customerId: String(item.id),
          },
        )
      }>
      <AppCard style={styles.customerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.customerInfo}>
          <Text
            style={styles.customerName}
            numberOfLines={1}>
            {item.name}
          </Text>

          {item.company_name ? (
            <Text
              style={styles.secondaryText}
              numberOfLines={1}>
              {item.company_name}
            </Text>
          ) : item.phone ? (
            <Text
              style={styles.secondaryText}
              numberOfLines={1}>
              {item.phone}
            </Text>
          ) : (
            <Text style={styles.secondaryText}>
              No contact details
            </Text>
          )}
        </View>

        <AppIcon
          name="chevron-right"
          size={20}
          color={colors.textMuted}
        />
      </AppCard>
    </Pressable>
  );



  return (
    <ScreenContainer
      title="Customers"
      scroll={false}
      contentStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Customer directory</Text>

        <Pressable
          onPress={handleAddCustomer}
          accessibilityRole="button"
          accessibilityLabel="Add customer"
          style={({ pressed }) => [
            styles.addCustomerButton,
            pressed && styles.addCustomerButtonPressed,
          ]}
        >
          <AppIcon name="plus" size={18} color={colors.primary} />
          <Text style={styles.addCustomerLabel}>Add customer</Text>
        </Pressable>
      </View>
      {customers.length > 0 ? (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search customers"
        />
      ) : null}

      {isLoading ? (
        <LoadingState fullscreen />
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load customers"
          message={error}
          actionLabel="Try again"
          onActionPress={refreshCustomers}
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={customers.length > 0 && searchQuery.trim() ? 'account-search-outline' : 'account-multiple-outline'}
          title={
            customers.length > 0 && searchQuery.trim()
              ? 'No matching customers'
              : 'No customers yet'
          }
          message={
            customers.length > 0 && searchQuery.trim()
              ? 'Try a different search term or clear your search.'
              : 'Add a customer to start tracking sales and invoices.'
          }
          actionLabel={customers.length > 0 && searchQuery.trim() ? 'Clear search' : undefined}
          onActionPress={customers.length > 0 && searchQuery.trim() ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={item => String(item.id)}
          renderItem={renderCustomer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshCustomers}
          refreshing={isLoading}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  customerCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginRight: spacing.md,
  },

  customerInfo: {
    flex: 1,
    minWidth: 0,
  },

  secondaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.primary,
  },
  customerName: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 26,
    color: colors.textMuted,
    marginLeft: 8,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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

addCustomerButton: {
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

addCustomerButtonPressed: {
  backgroundColor: colors.primaryLight,
  borderColor: colors.primary,
},

addCustomerLabel: {
  ...typography.label,
  color: colors.primary,
},
});

