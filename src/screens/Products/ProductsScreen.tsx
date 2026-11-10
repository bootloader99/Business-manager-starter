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
  StatusBadge,
} from '../../components';
import { Routes } from '../../constants';
import type { Product } from '../../database/types';
import { useProducts } from '../../hooks/useProducts';
import type { MoreStackParamList } from '../../navigation/types';
import {
  radius,
  spacing,
  typography,
  useTheme,
} from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils';

type Nav = NativeStackNavigationProp<
  MoreStackParamList,
  'Products'
>;

export default function ProductsScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();

  const {
    products,
    isLoading,
    error,
    refreshProducts,
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isFocused) {
      refreshProducts();
    }
  }, [isFocused, refreshProducts]);

  const hasSearchQuery = searchQuery.trim().length > 0;

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const handleCreate = () => {
    navigation.navigate(Routes.ProductForm, {});
  };

  const handleOpenProduct = (product: Product) => {
    navigation.navigate(Routes.ProductDetails, {
      productId: String(product.id),
    });
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isService = item.type === 'service';

    return (
      <AppCard
        onPress={() => handleOpenProduct(item)}
        style={styles.productCard}
      >
        <View
          style={[
            styles.typeIcon,
            isService && styles.serviceTypeIcon,
          ]}
        >
          <AppIcon
            name={isService ? 'briefcase-outline' : 'package-variant'}
            size={22}
            color={isService ? colors.success : colors.primary}
          />
        </View>

        <View style={styles.productInfo}>
          <Text
            style={styles.productName}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <View style={styles.metaRow}>
            <StatusBadge
              label={isService ? 'Service' : 'Product'}
              variant={isService ? 'success' : 'primary'}
            />

            {item.sku?.trim() ? (
              <Text
                style={styles.secondaryText}
                numberOfLines={1}
              >
                {item.sku.trim()}
              </Text>
            ) : null}
          </View>

          {!isService && item.track_stock === 1 ? (
            <Text
              style={styles.stockText}
              numberOfLines={1}
            >
              {item.stock_quantity} in stock
            </Text>
          ) : null}
        </View>

        <View style={styles.priceContainer}>
          <Text
            style={styles.price}
            numberOfLines={1}
          >
            {formatCurrency(item.price_minor)}
          </Text>

          <AppIcon
            name="chevron-right"
            size={20}
            color={colors.textMuted}
          />
        </View>
      </AppCard>
    );
  };

  return (
    <ScreenContainer
      title="Products & Services"
      scroll={false}
      contentStyle={styles.screenContent}
    >
      <View style={styles.content}>
        <View style={styles.catalogHeader}>
          <Text style={styles.catalogTitle}>Catalog</Text>

          <Pressable
            onPress={handleCreate}
            accessibilityRole="button"
            accessibilityLabel="Add product or service"
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <AppIcon name="plus" size={18} color={colors.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {products.length > 0 ? (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products and services"
          />
        ) : null}

        {isLoading && products.length === 0 ? (
          <View style={styles.stateContainer}>
            <LoadingState />
          </View>
        ) : error && products.length === 0 ? (
          <View style={styles.stateContainer}>
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load products"
              message={error}
              actionLabel="Try again"
              onActionPress={refreshProducts}
            />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.stateContainer}>
            <EmptyState
              icon={products.length > 0 && hasSearchQuery ? 'magnify' : 'package-variant'}
              title={
                products.length > 0 && hasSearchQuery
                  ? 'No matching items'
                  : 'No products or services yet'
              }
              message={
                products.length > 0 && hasSearchQuery
                  ? 'Try a different search term or clear your search.'
                  : 'Your products and services will appear here once added.'
              }
              actionLabel={products.length > 0 && hasSearchQuery ? 'Clear search' : undefined}
              onActionPress={products.length > 0 && hasSearchQuery ? () => setSearchQuery('') : undefined}
            />
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={filteredProducts}
            keyExtractor={item => String(item.id)}
            renderItem={renderProduct}
            ItemSeparatorComponent={ProductSeparator}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onRefresh={refreshProducts}
            refreshing={isLoading}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function ProductSeparator() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return <View style={styles.separator} />;
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  screenContent: {
    flex: 1,
    padding: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    marginTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
  productCard: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  serviceTypeIcon: {
    backgroundColor: colors.successLight,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  productName: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  secondaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  stockText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xs,
    maxWidth: '35%',
  },
  price: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  catalogTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  addButton: {
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
  addButtonPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  addButtonText: {
    ...typography.label,
    color: colors.primary,
  },
});