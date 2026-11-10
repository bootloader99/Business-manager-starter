
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  AppButton,
  AppTextInput,
  DateInput,
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
import { createInvoice } from '../../database/repositories/invoiceRepository';
import { getProducts } from '../../database/repositories/productRepository';
import type { Customer, Product } from '../../database/types';
import type { MoreStackParamList } from '../../navigation/types';
import { Routes } from '../../constants';
import { spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { dateInputToIsoTimestamp, getTodayDateInput, isValidDateInput } from '../../utils/validation';
import { calculateTransactionTotals, validateDiscountField } from '../../utils/transactionTotals';

type Props = NativeStackScreenProps<
  MoreStackParamList,
  'CreateInvoice'
>;

type DraftItem = {
  product_id: number;
  name: string;
  quantity: number;
  unit_price_minor: number;
  tax_rate: number;
};

export default function CreateInvoiceScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const { showToast } = useAppToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [issueDate, setIssueDate] = useState(getTodayDateInput());
  const [dueDate, setDueDate] = useState('');
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
      console.error('Failed to load invoice form data:', err);
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
  const discountError = discountValidation.error;
  const discountIsInvalid = Boolean(discountError);
  const discountMinor = discountIsInvalid ? 0 : discountValidation.discountMinor;

  const totals = useMemo(
    () => calculateTransactionTotals(items, discountMinor),
    [items, discountMinor],
  );
  const taxMinor = totals.taxMinor;
  const totalMinor = totals.totalMinor;

  function addProduct(product: Product) {
    if (product.type === 'product' && product.track_stock === 1 && product.stock_quantity <= 0) {
      showToast({ message: `${product.name} is out of stock and cannot be added to an invoice.`, type: 'error' });
      return;
    }

    const existingItem = items.find(
      item => item.product_id === product.id,
    );

    if (existingItem) {
      setItems(current =>
        current.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );

      setShowProductPicker(false);
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

  function updateItemQuantity(
    productId: number,
    quantity: number,
  ) {
    if (quantity < 1) return;
    const product = products.find(item => item.id === productId);
    if (product?.type === 'product' && product.track_stock === 1 && quantity > product.stock_quantity) {
      showToast({ message: `${product.name} has only ${product.stock_quantity} available.`, type: 'error' });
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

  function getLineItemData(
    item: DraftItem,
  ): TransactionLineItemData {
    return {
      id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unitPriceMinor: item.unit_price_minor,
      totalMinor: item.quantity * item.unit_price_minor,
      taxRate: item.tax_rate,
    };
  }

  async function handleSave() {
    if (items.length === 0) {
      showToast({
        message: 'Add at least one product or service before saving the invoice.',
        type: 'info',
      });
      return;
    }

    const submitDiscountValidation = validateDiscountField(
      discount,
      subtotalMinor,
      true,
    );
    if (submitDiscountValidation.error) {
      showToast({ message: submitDiscountValidation.error, type: 'error' });
      return;
    }

    if (!isValidDateInput(issueDate)) {
      showToast({ message: 'Enter a valid invoice date in YYYY-MM-DD format.', type: 'error' });
      return;
    }

    if (dueDate.trim() && !isValidDateInput(dueDate)) {
      showToast({
        message: 'Enter the due date in YYYY-MM-DD format.',
        type: 'error',
      });
      return;
    }

    try {
      setIsSaving(true);

      await createInvoice({
        customer_id: customerId,
        issue_date: dateInputToIsoTimestamp(issueDate),
        due_date: dueDate.trim() || null,
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
        message: 'The invoice has been saved as a draft.',
        type: 'success',
      });
      navigation.popTo(Routes.Invoices);
    } catch (err) {
      console.error('Failed to create invoice:', err);

      showToast({
        message: err instanceof Error ? err.message : 'Something went wrong while saving the invoice.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState fullscreen />;
  }

  if (error) {
    return (
      <ScreenContainer title="New Invoice" scroll={false}>
        <View style={styles.errorContainer}>
          <EmptyState
            title="Unable to load invoice form"
            message={error}
            actionLabel="Try Again"
            onActionPress={loadData}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="New Invoice" scroll={false}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screenHeader}>
            <Text style={styles.screenSubtitle}>
              Create a draft invoice for your customer.
            </Text>
          </View>

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
            <SectionHeader
              title="Items"
              subtitle={
                items.length > 0
                  ? `${items.length} item${items.length === 1 ? '' : 's'}`
                  : 'Add products or services to this invoice.'
              }
              actionLabel="+ Add item"
              onActionPress={() => setShowProductPicker(true)}
            />

            {items.length === 0 ? (
              <EmptyState
                icon="package-variant"
                title="No items added yet"
                message="Add a product or service to calculate the invoice total."
              />
            ) : (
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
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Invoice Details" />

            <DateInput
              label="Invoice Date"
              required
              value={issueDate}
              onChangeText={setIssueDate}
              placeholder="YYYY-MM-DD"
              editable={!isSaving}
            />

            <DateInput
              label="Due Date"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              editable={!isSaving}
            />

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

          <View style={styles.section}>
            <SectionHeader title="Summary" />

            <SummaryCard
              rows={[
                {
                  label: 'Subtotal',
                  value: formatCurrency(subtotalMinor),
                },
                {
                  label: 'Discount',
                  value: `-${formatCurrency(discountMinor)}`,
                },
                {
                  label: 'Tax',
                  value: formatCurrency(taxMinor),
                },
                {
                  label: 'Total',
                  value: formatCurrency(totalMinor),
                  emphasized: true,
                },
              ]}
            />
          </View>

          <AppButton
            title="Save Draft"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || items.length === 0}
            style={styles.saveButton}
          />
        </ScrollView>

        <CatalogItemPicker
          products={products}
          visible={showProductPicker}
          onClose={() => setShowProductPicker(false)}
          onSelect={addProduct}
          disableOutOfStock
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.background,
  },


  content: {
    paddingHorizontal: 0,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  screenHeader: {
    marginBottom: spacing.sm,
  },

  screenSubtitle: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  section: {
    marginTop: spacing.md,
  },

  itemList: {
    // TransactionLineItem already provides bottom spacing.
  },

  emptyItems: {
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },

  emptyItemsText: {
    gap: spacing.xs,
  },

  emptyItemsTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  emptyItemsDescription: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  saveButton: {
    marginTop: spacing.md,
  },

  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
});


