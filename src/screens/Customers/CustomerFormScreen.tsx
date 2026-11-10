import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppButton,
  AppTextInput,
  EmptyState,
  LoadingState,
  ScreenContainer,
} from '../../components';
import { getCustomerById } from '../../database/repositories/customerRepository';
import { useCustomers } from '../../hooks/useCustomers';
import type { CustomersStackParamList } from '../../navigation/types';
import { spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { normalizeInternationalPhoneInput, validateEmail, validateInternationalPhone } from '../../utils/validation';

type Props = NativeStackScreenProps<
  CustomersStackParamList,
  'CustomerForm'
>;

type FormState = {
  name: string;
  phone: string;
  email: string;
  company_name: string;
  tax_number: string;
  address: string;
  notes: string;
};

const emptyForm: FormState = {
  name: '',
  phone: '',
  email: '',
  company_name: '',
  tax_number: '',
  address: '',
  notes: '',
};

export default function CustomerFormScreen({ route }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { addCustomer, editCustomer } = useCustomers();

  const customerId = route.params?.customerId
    ? Number(route.params.customerId)
    : null;

  const isEdit = customerId !== null;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const initialPhoneRef = useRef('');
  const initialEmailRef = useRef('');

  useEffect(() => {
    if (!customerId) {
      return;
    }

    const loadCustomer = async () => {
      try {
        const customer = await getCustomerById(customerId);

        if (!customer) {
          setError('Customer not found.');
          return;
        }

        initialPhoneRef.current = customer.phone ?? '';
        initialEmailRef.current = customer.email ?? '';
        setForm({
          name: customer.name,
          phone: customer.phone ?? '',
          email: customer.email ?? '',
          company_name: customer.company_name ?? '',
          tax_number: customer.tax_number ?? '',
          address: customer.address ?? '',
          notes: customer.notes ?? '',
        });
      } catch (err) {
        console.error('Failed to load customer:', err);
        setError('Unable to load customer.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm(current => ({
      ...current,
      [field]: value,
    }));

    if (field === 'name') setNameError(null);
    if (field === 'phone') setPhoneError(null);
    if (field === 'email') setEmailError(null);
  };

  const handleSave = async () => {
    const name = form.name.trim();

    const nextNameError = name ? null : 'Enter a customer name.';
    setNameError(nextNameError);
    if (nextNameError) return;

    const normalizedPhone = form.phone.trim();
    const normalizedEmail = form.email.trim();
    const nextPhoneError = normalizedPhone === initialPhoneRef.current.trim() ? null : validateInternationalPhone(normalizedPhone);
    const nextEmailError = normalizedEmail === initialEmailRef.current.trim() ? null : validateEmail(normalizedEmail);
    setPhoneError(nextPhoneError);
    setEmailError(nextEmailError);
    if (nextPhoneError || nextEmailError) return;

    try {
      setError(null);
      setIsSaving(true);

      const input = {
        name,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        company_name: form.company_name.trim() || null,
        tax_number: form.tax_number.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (isEdit && customerId !== null) {
        await editCustomer(customerId, input);
      } else {
        await addCustomer(input);
      }

      navigation.goBack();
    } catch (err) {
      console.error('Failed to save customer:', err);
      setError('Unable to save customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer title={isEdit ? 'Edit customer' : 'Add customer'}>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (error === 'Customer not found.' || error === 'Unable to load customer.') {
    return (
      <ScreenContainer title={isEdit ? 'Edit customer' : 'Add customer'}>
        <EmptyState
          title="Unable to load customer"
          message={error}
          actionLabel="Go back"
          onActionPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title={isEdit ? 'Edit customer' : 'Add customer'}
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
            <Text style={styles.formIntroTitle}>
              {isEdit ? 'Customer details' : 'Add contact details'}
            </Text>

            <Text style={styles.formIntroSubtitle}>
              {isEdit
                ? 'Update your customer’s information below.'
                : 'Save contact information to keep your customers organised.'}
            </Text>
          </View>

          {error ? (
            <View
              accessibilityRole="alert"
              style={styles.errorBox}
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <AppTextInput
              label="Name *"
              value={form.name}
              onChangeText={value => updateField('name', value)}
              placeholder="Customer name"
              autoCapitalize="words"
              error={nameError ?? undefined}
            />

            <AppTextInput
              label="Phone"
              value={form.phone}
              onChangeText={value => updateField('phone', normalizeInternationalPhoneInput(value))}
              placeholder="Phone number with country code"
              keyboardType="phone-pad"
              maxLength={16}
              error={phoneError ?? undefined}
            />

            <AppTextInput
              label="Email"
              value={form.email}
              onChangeText={value => updateField('email', value)}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError ?? undefined}
            />

            <AppTextInput
              label="Company"
              value={form.company_name}
              onChangeText={value => updateField('company_name', value)}
              placeholder="Company name"
            />

            <AppTextInput
              label="Tax number"
              value={form.tax_number}
              onChangeText={value => updateField('tax_number', value)}
              placeholder="Tax / VAT number"
            />

            <AppTextInput
              label="Address"
              value={form.address}
              onChangeText={value => updateField('address', value)}
              placeholder="Business or billing address"
              multiline
              textAlignVertical="top"
            />

            <AppTextInput
              label="Notes"
              value={form.notes}
              onChangeText={value => updateField('notes', value)}
              placeholder="Additional notes"
              multiline
              textAlignVertical="top"
            />
          </View>

          <AppButton
            title={isEdit ? 'Save changes' : 'Save customer'}
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
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  formIntro: {
    gap: spacing.xs,
  },

  formIntroTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  formIntroSubtitle: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  fields: {
    gap: spacing.md,
  },

  errorBox: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
  },

  errorText: {
    ...typography.secondary,
    color: colors.danger,
  },

  saveButton: {
    marginTop: spacing.sm,
  },
});

