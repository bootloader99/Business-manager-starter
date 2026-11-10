
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  AppButton,
  AppTextInput,
  LoadingState,
  ScreenContainer,
  SectionHeader,
  useAppToast,
} from '../../components';
import { useBusinessProfile } from '../../hooks/useBusinessProfile';
import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { fontFamily } from '../../theme/typography';

export default function InvoiceSettingsScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation();
  const { showToast } = useAppToast();

  const {
    business,
    isLoading,
    isSaving,
    error,
    saveInvoiceSettings,
  } = useBusinessProfile();

  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState('');
  const [paymentMethods, setPaymentMethods] = useState('');

  const initialized = useRef(false);

  useEffect(() => {
    if (isLoading || !business || initialized.current) {
      return;
    }

    setInvoicePrefix(business.invoice_prefix);
    setNextInvoiceNumber(String(business.next_invoice_number));
    setDefaultTaxRate(String(business.default_tax_rate));
    setPaymentMethods(business.payment_methods);

    initialized.current = true;
  }, [business, isLoading]);

  const handleSave = () => {
    const invoiceNumber = Number(nextInvoiceNumber);
    const taxRate = Number(defaultTaxRate);

    if (!invoicePrefix.trim()) {
      showToast({ message: 'Invoice prefix is required.', type: 'error' });
      return;
    }

    if (!Number.isInteger(invoiceNumber) || invoiceNumber < 1) {
      showToast({
        message: 'Next invoice number must be a positive whole number.',
        type: 'error',
      });
      return;
    }

    if (
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate > 100
    ) {
      showToast({
        message: 'Default tax rate must be between 0 and 100.',
        type: 'error',
      });
      return;
    }

    try {
      saveInvoiceSettings({
        invoice_prefix: invoicePrefix.trim(),
        next_invoice_number: invoiceNumber,
        default_tax_rate: taxRate,
        payment_methods: paymentMethods.trim(),
      });

      showToast({
        message: 'Invoice settings updated successfully.',
        type: 'success',
      });
      navigation.goBack();
    } catch {
      // The hook exposes the save error.
    }
  };

  if (isLoading || !business) {
    return (
      <ScreenContainer title="Invoice settings">
        <LoadingState fullscreen />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Invoice settings"
      scroll={false}
      contentStyle={styles.screenContent}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.subtitle}>
            Configure invoice defaults
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Invoice Numbering" />

          <AppTextInput
            label="Invoice prefix"
            required
            value={invoicePrefix}
            onChangeText={setInvoicePrefix}
            placeholder="INV"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <AppTextInput
            label="Next invoice number"
            required
            value={nextInvoiceNumber}
            onChangeText={setNextInvoiceNumber}
            placeholder="1"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Defaults" />

          <AppTextInput
            label="Default tax rate"
            value={defaultTaxRate}
            onChangeText={setDefaultTaxRate}
            placeholder="0"
            keyboardType="decimal-pad"
            suffix="%"
          />

          <AppTextInput
            label="Payment methods"
            value={paymentMethods}
            onChangeText={setPaymentMethods}
            placeholder="Cash, Bank transfer, Card"
            helperText="Separate payment methods with commas."
          />
        </View>

        <View style={styles.actions}>
          <AppButton
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
          />

          <Pressable
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
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
  },

  intro: {
    marginBottom: spacing.lg,
  },

  subtitle: {
    ...typography.body,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },

  section: {
    marginTop: spacing.sm,
  },

  errorBox: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
  },

  errorText: {
    ...typography.secondary,
    color: colors.danger,
  },

  actions: {
    marginTop: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },

  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  cancelButtonText: {
    ...typography.body,
    fontFamily: typography.label.fontFamily,
    color: colors.primary,
  },
});


