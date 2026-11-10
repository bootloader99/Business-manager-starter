import {
  useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppButton,
  AppCard,
  AppTextInput,
  EmptyState,
  LoadingState,
  ScreenContainer,
  SegmentedControl,
} from '../../components';
import { getProductById } from '../../database/repositories/productRepository';
import type { ProductType } from '../../database/types';
import { useProducts } from '../../hooks/useProducts';
import type { MoreStackParamList } from '../../navigation/types';
import {
  radius,
  spacing,
  typography,
  useTheme,
} from '../../theme';
import type { AppTheme } from '../../theme/theme';

type Props = NativeStackScreenProps<
  MoreStackParamList,
  'ProductForm'
>;

type FormState = {
  name: string;
  type: ProductType;
  sku: string;
  description: string;
  price: string;
  cost: string;
  taxRate: string;
  trackStock: boolean;
  stockQuantity: string;
};

const emptyForm: FormState = {
  name: '',
  type: 'product',
  sku: '',
  description: '',
  price: '',
  cost: '',
  taxRate: '0',
  trackStock: false,
  stockQuantity: '',
};

const typeOptions = [
  { label: 'Product', value: 'product' },
  { label: 'Service', value: 'service' },
] as const;

export default function ProductFormScreen({ route }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList, 'ProductForm'>>();
  const insets = useSafeAreaInsets();

  const { addProduct, editProduct } = useProducts();

  const productId = route.params?.productId
    ? Number(route.params.productId)
    : null;

  const isEdit = productId !== null;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId === null) {
      return;
    }

    const loadProduct = async () => {
      try {
        const product = await getProductById(productId);

        if (!product || !product.is_active) {
          setError('Product not found.');
          return;
        }

        setForm({
          name: product.name,
          type: product.type,
          sku: product.sku ?? '',
          description: product.description ?? '',
          price: (product.price_minor / 100).toFixed(2),
          cost: (product.cost_minor / 100).toFixed(2),
          taxRate: String(product.tax_rate),
          trackStock: product.track_stock === 1,
          stockQuantity: String(product.stock_quantity),
        });
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Unable to load product.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm(current => ({
      ...current,
      [field]: value,
    }));
  };

  const parseMoneyToMinor = (value: string): number | null => {
    const normalized = value.replace(/,/g, '').trim();

    if (!normalized) {
      return 0;
    }

    const amount = Number(normalized);

    if (!Number.isFinite(amount) || amount < 0) {
      return null;
    }

    return Math.round(amount * 100);
  };

  const handleSave = async () => {
    const name = form.name.trim();

    if (!name) {
      setError('Please enter a product or service name.');
      return;
    }

    if (!form.price.trim()) {
      setError('Enter a selling price. Use 0 for a free item.');
      return;
    }

    const priceMinor = parseMoneyToMinor(form.price);
    const costMinor = parseMoneyToMinor(form.cost);

    if (priceMinor === null || costMinor === null) {
      setError('Please enter valid price and cost values.');
      return;
    }

    const taxRate = Number(form.taxRate);

    if (
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate > 100
    ) {
      setError('Please enter a tax rate between 0 and 100.');
      return;
    }

    const stockQuantity = Number(form.stockQuantity);

    if (
      form.type === 'product' && form.trackStock &&
      (!form.stockQuantity.trim() || !Number.isFinite(stockQuantity) || stockQuantity < 0)
    ) {
      setError('Please enter a valid stock quantity.');
      return;
    }

    try {
      setError(null);
      setIsSaving(true);

      const input = {
        name,
        type: form.type,
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        price_minor: priceMinor,
        cost_minor: costMinor,
        tax_rate: taxRate,
        track_stock:
          form.type === 'product' && form.trackStock ? 1 : 0,
        stock_quantity:
          form.type === 'product'
            ? Math.max(0, Math.floor(stockQuantity))
            : 0,
      };

      if (isEdit && productId !== null) {
        await editProduct(productId, input);
      } else {
        await addProduct(input);
      }

      navigation.goBack();
    } catch (err) {
      console.error('Failed to save product:', err);
      setError('Unable to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer
        title={isEdit ? 'Edit item' : 'Add item'}
        scroll={false}
      >
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (
    error === 'Product not found.' ||
    error === 'Unable to load product.'
  ) {
    return (
      <ScreenContainer title={isEdit ? 'Edit item' : 'Add item'}>
        <EmptyState
          title="Unable to load item"
          message={error}
          actionLabel="Go back"
          onActionPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title={isEdit ? 'Edit item' : 'Add item'}
      scroll={false}
      contentStyle={styles.screenContent}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formIntro}>
            <Text style={styles.formTitle}>
              {isEdit ? 'Item details' : 'New catalog item'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isEdit
                ? 'Update the product or service information.'
                : 'Add a product or service to your catalog.'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Type</Text>
              <SegmentedControl
                options={typeOptions}
                value={form.type}
                onChange={value => {
                  updateField('type', value);
                  setError(null);
                }}
              />
            </View>

            <AppTextInput
              label="Name"
              value={form.name}
              onChangeText={value => updateField('name', value)}
              placeholder={
                form.type === 'product' ? 'Product name' : 'Service name'
              }
              autoCapitalize="words"
              required
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <AppTextInput
                  label="Selling price"
                  value={form.price}
                  onChangeText={value => updateField('price', value)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  required
                />
              </View>

              <View style={styles.halfField}>
                <AppTextInput
                  label="Cost"
                  value={form.cost}
                  onChangeText={value => updateField('cost', value)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <AppTextInput
                  label="SKU"
                  value={form.sku}
                  onChangeText={value => updateField('sku', value)}
                  placeholder="Optional"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.halfField}>
                <AppTextInput
                  label="Tax rate"
                  value={form.taxRate}
                  onChangeText={value => updateField('taxRate', value)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  suffix="%"
                />
              </View>
            </View>

            {form.type === 'product' ? (
              <AppCard style={styles.stockCard}>
                <View style={styles.stockHeader}>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockTitle}>Track stock</Text>
                    <Text style={styles.stockDescription}>
                      Keep track of available units for this product.
                    </Text>
                  </View>

                  <Switch
                    value={form.trackStock}
                    onValueChange={value => updateField('trackStock', value)}
                    trackColor={{
                      false: colors.border,
                      true: colors.primaryLight,
                    }}
                    thumbColor={
                      form.trackStock ? colors.primary : colors.surface
                    }
                    accessibilityLabel="Track product stock"
                  />
                </View>

                {form.trackStock ? (
                  isEdit ? (
                    <Text style={styles.stockDescription}>
                      Current stock: {form.stockQuantity}
                    </Text>
                  ) : (
                    <AppTextInput
                      label="Opening stock quantity"
                      value={form.stockQuantity}
                      onChangeText={value =>
                        updateField('stockQuantity', value)
                      }
                      placeholder="Enter quantity"
                      keyboardType="number-pad"
                    />
                  )
                ) : null}
              </AppCard>
            ) : null}

            <AppTextInput
              label="Description"
              value={form.description}
              onChangeText={value => updateField('description', value)}
              placeholder="Optional description"
              multiline
              textAlignVertical="top"
            />
          </View>

          <AppButton
            title={isEdit ? 'Save changes' : 'Save item'}
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    gap: spacing.lg,
  },
  formIntro: {
    gap: spacing.xs,
  },
  formTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  formSubtitle: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  fields: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
    minWidth: 0,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },
  errorText: {
    ...typography.secondary,
    color: colors.danger,
  },
  stockCard: {
    padding: spacing.md,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stockInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  stockTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  stockDescription: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  stockFields: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.xs,
  },
});