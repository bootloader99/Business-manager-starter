import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppButton,
  AppIcon,
  AppTextInput,
  EmptyState,
  LoadingState,
  ScreenContainer,
  SectionHeader,
  SummaryCard,
  useAppToast,
} from '../../components';
import {
  CatalogItemPicker,
  CustomerSelector,
  TransactionLineItem,
  type TransactionLineItemData,
} from '../../features/transactions/components';
import { getCustomers } from '../../database/repositories/customerRepository';
import { getProducts } from '../../database/repositories/productRepository';
import type { Customer, Product } from '../../database/types';
import { useSales } from '../../hooks/useSales';
import type { SalesStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateTransactionTotals, validateDiscountField } from '../../utils/transactionTotals';

type Props = NativeStackScreenProps<SalesStackParamList, 'CreateSale'>;

type DraftItem = {
  product_id: number;
  name: string;
  quantity: number;
  unit_price_minor: number;
  tax_rate: number;
};

export function CreateSaleScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const { showToast } = useAppToast();
  const insets = useSafeAreaInsets();
  const { addSale } = useSales();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      const [customerResult, productResult] = await Promise.all([
        getCustomers(),
        getProducts(),
      ]);

      setCustomers(customerResult);
      setProducts(productResult);
    } catch (err) {
      console.error('Failed to load sale form data:', err);
      setError('Unable to load customers and products.');
    } finally {
      setIsLoading(false);
    }
  }

  const subtotalMinor = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + Math.round(item.quantity * item.unit_price_minor),
        0,
      ),
    [items],
  );

  const discountValidation = validateDiscountField(discount, subtotalMinor);
  const discountIsInvalid = Boolean(discountValidation.error);
  const discountError = discountValidation.error;
  const discountMinor = discountIsInvalid ? 0 : discountValidation.discountMinor;

  const totals = useMemo(
    () => calculateTransactionTotals(items, discountMinor),
    [items, discountMinor],
  );
  const taxMinor = totals.taxMinor;
  const totalMinor = totals.totalMinor;

  function addProduct(product: Product) {
    const existingItem = items.find(
      item => item.product_id === product.id,
    );

    if (existingItem) {
      const requestedQuantity = existingItem.quantity + 1;

      if (
        product.type === 'product' &&
        product.track_stock === 1 &&
        requestedQuantity > product.stock_quantity
      ) {
        showToast({
          message: `${product.name} has only ${product.stock_quantity} available.`,
          type: 'error',
        });
        return;
      }

      setItems(current =>
        current.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: requestedQuantity }
            : item,
        ),
      );

      setShowProductPicker(false);
      return;
    }

    if (
      product.type === 'product' &&
      product.track_stock === 1 &&
      product.stock_quantity <= 0
    ) {
      showToast({
        message: `${product.name} is currently out of stock.`,
        type: 'error',
      });
      return;
    }

    setItems(current => [
      ...current,
      {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price_minor: product.price_minor,
        tax_rate: product.tax_rate,
      },
    ]);

    setShowProductPicker(false);
  }

  function updateItemQuantity(productId: number, quantity: number) {
    const product = products.find(item => item.id === productId);

    if (!product) {
      return;
    }

    if (
      product.type === 'product' &&
      product.track_stock === 1 &&
      quantity > product.stock_quantity
    ) {
      showToast({
          message: `${product.name} has only ${product.stock_quantity} available.`,
          type: 'error',
        });
      return;
    }

    setItems(current =>
      current.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item,
      ),
    );
  }

  function removeItem(productId: number) {
    setItems(current =>
      current.filter(item => item.product_id !== productId),
    );
  }

  function getLineItemData(item: DraftItem): TransactionLineItemData {
    return {
      id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unitPriceMinor: item.unit_price_minor,
      totalMinor: item.quantity * item.unit_price_minor,
      taxRate: item.tax_rate,
      footerText: getStockText(item.product_id),
    };
  }

  function getStockText(productId: number): string | undefined {
    const product = products.find(item => item.id === productId);

    if (
      product?.type === 'product' &&
      product.track_stock === 1
    ) {
      return `${product.stock_quantity} in stock`;
    }

    return undefined;
  }

  async function handleSave() {
    const submitDiscountValidation = validateDiscountField(
      discount,
      subtotalMinor,
      true,
    );
    if (submitDiscountValidation.error) {
      showToast({
        message: submitDiscountValidation.error,
        type: 'error',
      });
      return;
    }

    if (items.length === 0) {
      showToast({
        message: 'Add at least one product or service before saving the sale.',
        type: 'info',
      });
      return;
    }

    try {
      setIsSaving(true);

      await addSale({
        customer_id: customerId,
        status: 'completed',
        discount_minor: discountMinor,
        notes: notes.trim() || null,
        items: items.map(item => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          unit_price_minor: item.unit_price_minor,
          tax_rate: item.tax_rate,
          discount_minor: 0,
        })),
      });

      showToast({
        message: 'The sale has been saved successfully.',
        type: 'success',
      });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to create sale:', err);

      showToast({
        message: err instanceof Error ? err.message : 'Something went wrong while saving the sale.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer title="Create Sale" subtitle="Loading sale form...">
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer title="Create Sale">
        <EmptyState
          title="Unable to load sale form"
          message={error}
          actionLabel="Try Again"
          onActionPress={loadData}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Create Sale"
      subtitle="Add the customer and items for this sale."
      scroll={false}
      contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <SectionHeader title="Customer" />

            <CustomerSelector
              customers={customers}
              selectedCustomerId={customerId}
              onChange={setCustomerId}
              disabled={isSaving}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.itemsHeader}>
              <View style={styles.itemsHeaderText}>
                <SectionHeader
                  title="Items"
                  subtitle={
                    items.length > 0
                      ? `${items.length} item${items.length === 1 ? '' : 's'}`
                      : 'Add products or services to this sale.'
                  }
                />
              </View>

              <Pressable
                onPress={() => setShowProductPicker(true)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Add item"
                style={({ pressed }) => [
                  styles.addItemAction,
                  pressed && styles.addItemActionPressed,
                  isSaving && styles.disabledAction,
                ]}>
                <AppIcon name="plus" size={18} color={colors.primary} />
                <Text style={styles.addItemActionLabel}>Add item</Text>
              </Pressable>
            </View>

            {items.length === 0 ? (
              <EmptyState
                icon="package-variant"
                title="No items added"
                message="Tap Add item above to select a product or service."
              />
            ) : (
              <>
                <View style={styles.itemList}>
                  {items.map(item => (
                    <TransactionLineItem
                      key={item.product_id}
                      item={getLineItemData(item)}
                      onDecrease={() =>
                        updateItemQuantity(
                          item.product_id,
                          item.quantity - 1,
                        )
                      }
                      onIncrease={() =>
                        updateItemQuantity(
                          item.product_id,
                          item.quantity + 1,
                        )
                      }
                      onRemove={() => removeItem(item.product_id)}
                      disabled={isSaving}
                    />
                  ))}
                </View>

              </>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Pricing" />

            <View style={styles.formFields}>
              <AppTextInput
                label="Discount"
                value={discount}
                onChangeText={setDiscount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                suffix="₹"
                error={discountError}
                editable={!isSaving}
              />

              <AppTextInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add an optional note..."
                multiline
                editable={!isSaving}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Summary" />

            <SummaryCard
              rows={[
                { label: 'Subtotal', value: formatCurrency(subtotalMinor) },
                {
                  label: 'Discount',
                  value: `-${formatCurrency(discountMinor)}`,
                },
                { label: 'Tax', value: formatCurrency(taxMinor) },
                {
                  label: 'Total',
                  value: formatCurrency(totalMinor),
                  emphasized: true,
                },
              ]}
            />
          </View>

          <AppButton
            title="Save Sale"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || items.length === 0}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <CatalogItemPicker
        products={products}
        visible={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        onSelect={addProduct}
        disableOutOfStock
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  screenContent: {
    flex: 1,
    padding: 0,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  formContent: {
    flexGrow: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },

  section: {
    marginTop: spacing.md,
  },

  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  itemsHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  addItemAction: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  addItemActionPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  disabledAction: {
    opacity: 0.5,
  },

  addItemActionLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  },

  itemList: {
    gap: spacing.sm,
  },

  formFields: {
    gap: spacing.md,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
});

