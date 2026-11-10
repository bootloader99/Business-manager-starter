import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppButton,
  AppCard,
  AppTextInput,
  EmptyState,
} from '../../../components';
import type { Product } from '../../../database/types';
import { radius, spacing, typography, useTheme, type AppTheme } from '../../../theme';
import { formatCurrency } from '../../../utils';
import { fontFamily } from '../../../theme/typography';

type Props = {
  products: Product[];
  visible: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  disableOutOfStock?: boolean;
  outOfStockHint?: string;
};

export function CatalogItemPicker({
  products,
  visible,
  onClose,
  onSelect,
  disableOutOfStock = false,
  outOfStockHint,
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme.colors);
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter(product => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  function close() {
    setSearch('');
    onClose();
  }

  function handleSelect(product: Product) {
    const outOfStock =
      product.type === 'product' &&
      product.track_stock === 1 &&
      product.stock_quantity <= 0;

    if (disableOutOfStock && outOfStock) {
      return;
    }

    setSearch('');
    onSelect(product);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add item</Text>
              <Text style={styles.subtitle}>
                Choose a product or service.
              </Text>
            </View>

            <Pressable onPress={close} hitSlop={8}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <AppTextInput
            placeholder="Search products or services..."
            value={search}
            onChangeText={setSearch}
            autoFocus
          />

          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {filteredProducts.map(product => {
              const outOfStock =
                product.type === 'product' &&
                product.track_stock === 1 &&
                product.stock_quantity <= 0;

              const disabled = Boolean(
                disableOutOfStock && outOfStock,
              );

              const typeLabel =
                product.type === 'service'
                  ? 'Service'
                  : outOfStock
                    ? 'Out of stock'
                    : `${product.stock_quantity} in stock`;

              return (
                <AppCard
                  key={product.id}
                  onPress={() => handleSelect(product)}
                  disabled={disabled}
                  style={[
                    styles.option,
                    disabled && styles.optionDisabled,
                  ]}>
                  <View style={styles.productInfo}>
                    <Text
                      style={[
                        styles.optionTitle,
                        disabled && styles.disabledText,
                      ]}>
                      {product.name}
                    </Text>

                    <Text
                      style={[
                        styles.optionMeta,
                        disabled && styles.disabledText,
                      ]}>
                      {typeLabel}
                      {product.sku
                        ? ` • ${product.sku}`
                        : ''}
                    </Text>
                    {outOfStock && outOfStockHint ? (
                      <Text style={styles.outOfStockHint}>{outOfStockHint}</Text>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.price,
                      disabled && styles.disabledText,
                    ]}>
                    {formatCurrency(product.price_minor)}
                  </Text>
                </AppCard>
              );
            })}

            {filteredProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                message="Try a different search."
              />
            ) : null}
          </ScrollView>

          <AppButton
            title="Cancel"
            variant="secondary"
            onPress={close}
          />
        </View>
      </View>
    </Modal>
  );
}
const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
  },

  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  subtitle: {
    ...typography.secondary,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  closeText: {
    ...typography.label,
    color: colors.primary,
  },

  list: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  option: {
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
  },

  optionDisabled: {
    opacity: 0.6,
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.md,
    gap: spacing.xs,
  },

  optionTitle: {
    ...typography.body,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },

  outOfStockHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  optionMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  price: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flexShrink: 0,
    textAlign: 'right',
  },

  disabledText: {
    color: colors.textMuted,
  },
});