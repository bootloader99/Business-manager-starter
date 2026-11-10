import {
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppButton,
  AppCard,
  AppIcon,
  ConfirmationModal,
  DetailRow,
  DetailSection,
  EmptyState,
  LoadingState,
  ScreenContainer,
  StatusBadge,
  useAppToast,
} from '../../components';
import { Routes } from '../../constants';
import {
  deactivateProduct,
  getProductById,
} from '../../database/repositories/productRepository';
import type { Product } from '../../database/types';
import type { MoreStackParamList } from '../../navigation/types';
import {
  radius,
  spacing,
  typography,
  useTheme,
} from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils';

type Props = NativeStackScreenProps<
  MoreStackParamList,
  'ProductDetails'
>;

type Nav = NativeStackNavigationProp<
  MoreStackParamList,
  'ProductDetails'
>;

export default function ProductDetailsScreen({ route }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();
  const productId = Number(route.params.productId);
  const isFocused = useIsFocused();
  const [showDeactivateConfirmation, setShowDeactivateConfirmation] =
    useState(false);

  const { showToast } = useAppToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadProduct = async () => {
      setIsLoading(true);

      try {
        setError(null);

        const result = await getProductById(productId);

        if (!result || !result.is_active) {
          setProduct(null);
          setError('Product not found.');
          return;
        }

        setProduct(result);
      } catch (err) {
        console.error('Failed to load product:', err);
        setProduct(null);
        setError('Unable to load product.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId, isFocused]);

  const handleDeactivate = () => {
    if (!product || isDeactivating) {
      return;
    }

    setShowDeactivateConfirmation(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!product || isDeactivating) {
      return;
    }

    try {
      setIsDeactivating(true);

      await deactivateProduct(product.id);

      setShowDeactivateConfirmation(false);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to deactivate product:', err);

      setShowDeactivateConfirmation(false);

      showToast({
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong while deactivating the item.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Item" scroll={false}>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (error || !product) {
    return (
      <ScreenContainer title="Item" scroll={false}>
        <EmptyState
          title="Item unavailable"
          message={error ?? 'This item could not be found.'}
          actionLabel="Go back"
          onActionPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  const isService = product.type === 'service';

  const hasStockTracking = !isService && product.track_stock === 1;

  const hasSku = hasValue(product.sku);
  const hasDescription = hasValue(product.description);

  return (
    <>
      <ScreenContainer
        title="Item details"
        scroll={false}
        contentStyle={styles.screenContent}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppCard style={styles.profileCard}>
            <View
              style={[
                styles.typeIcon,
                isService && styles.serviceTypeIcon,
              ]}
            >
              <AppIcon
                name={isService ? 'briefcase-outline' : 'package-variant'}
                size={28}
                color={isService ? colors.success : colors.primary}
              />
            </View>

            <Text style={styles.name}>{product.name}</Text>

            <StatusBadge
              label={isService ? 'Service' : 'Product'}
              variant={isService ? 'success' : 'primary'}
            />

            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Selling price</Text>
              <Text style={styles.price}>
                {formatCurrency(product.price_minor)}
              </Text>
            </View>
          </AppCard>

          <DetailSection title="Pricing">
            <DetailRow
              label="Cost"
              value={formatCurrency(product.cost_minor)}
            />
            <DetailRow
              label="Tax rate"
              value={`${product.tax_rate}%`}
            />
          </DetailSection>

          {!isService ? (
            <DetailSection title="Stock">
              <DetailRow
                label="Stock tracking"
                value={hasStockTracking ? 'Enabled' : 'Disabled'}
              />

              {hasStockTracking ? (
                <>
                  <DetailRow
                    label="Quantity"
                    value={String(product.stock_quantity)}
                  />
                </>
              ) : null}
            </DetailSection>
          ) : null}

          {hasSku || hasDescription ? (
            <DetailSection title="Additional details">
              {hasSku ? (
                <DetailRow label="SKU" value={product.sku} />
              ) : null}

              {hasDescription ? (
                <DetailRow
                  label="Description"
                  value={product.description}
                  multiline
                />
              ) : null}
            </DetailSection>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title="Edit item"
              onPress={() =>
                navigation.navigate(Routes.ProductForm, {
                  productId: String(product.id),
                })
              }
            />

            <AppButton
              title="Deactivate item"
              variant="dangerOutline"
              onPress={handleDeactivate}
              loading={isDeactivating}
              disabled={isDeactivating}
            />
          </View>
        </ScrollView>
      </ScreenContainer>
      <ConfirmationModal
        visible={showDeactivateConfirmation}
        title="Deactivate item?"
        message={`${product.name} will be removed from your active catalog. Existing transactions will be kept.`}
        confirmLabel="Deactivate"
        destructive
        loading={isDeactivating}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          if (!isDeactivating) {
            setShowDeactivateConfirmation(false);
          }
        }}
      />
    </>
  );
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
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
    gap: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  serviceTypeIcon: {
    backgroundColor: colors.successLight,
  },
  name: {
    ...typography.section,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  priceBlock: {
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  priceLabel: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  price: {
    fontFamily: typography.metric.fontFamily,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningLight,
  },
  warningText: {
    ...typography.secondary,
    color: colors.warning,
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});