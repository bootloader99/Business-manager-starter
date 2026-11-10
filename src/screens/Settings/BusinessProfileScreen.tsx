
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
import { normalizeInternationalPhoneInput, validateEmail, validateInternationalPhone } from '../../utils/validation';
import { fontFamily } from '../../theme/typography';

export default function BusinessProfileScreen() {
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
    saveBusiness,
  } = useBusinessProfile();

  const [businessName, setBusinessName] = useState('');
  const [logoUri, setLogoUri] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [businessNameError, setBusinessNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (isLoading || !business || initialized.current) {
      return;
    }

    setBusinessName(business.business_name);
    setLogoUri(business.logo_uri ?? '');
    setEmail(business.email ?? '');
    setPhone(business.phone ?? '');
    setWebsite(business.website ?? '');
    setAddress(business.address ?? '');
    setTaxNumber(business.tax_number ?? '');

    initialized.current = true;
  }, [business, isLoading]);

  const handleSave = () => {
    const nextBusinessNameError = businessName.trim() ? null : 'Enter a business name.';
    setBusinessNameError(nextBusinessNameError);
    if (nextBusinessNameError) return;

    const nextPhoneError = phone.trim() === (business?.phone ?? '').trim() ? null : validateInternationalPhone(phone);
    const nextEmailError = email.trim() === (business?.email ?? '').trim() ? null : validateEmail(email);
    setPhoneError(nextPhoneError);
    setEmailError(nextEmailError);
    if (nextPhoneError || nextEmailError) return;

    try {
      saveBusiness({
        business_name: businessName.trim(),
        logo_uri: logoUri.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        address: address.trim(),
        tax_number: taxNumber.trim(),
      });

      showToast({
        message: 'Business profile updated successfully.',
        type: 'success',
      });
      navigation.goBack();
    } catch {
      // The hook exposes the save error.
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Business Profile">
        <LoadingState fullscreen />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Business Profile" scroll={false} contentStyle={styles.screenContent}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.subtitle}>
            Business information used throughout the app
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Business Information" />

          <AppTextInput
            label="Business name"
            required
            value={businessName}
            onChangeText={value => { setBusinessName(value); setBusinessNameError(null); }}
            error={businessNameError ?? undefined}
            placeholder="Enter business name"
            autoCapitalize="words"
          />

        </View>

        <View style={styles.section}>
          <SectionHeader title="Contact Information" />

          <AppTextInput
            label="Email"
            value={email}
            onChangeText={value => { setEmail(value); setEmailError(null); }}
            placeholder="business@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError ?? undefined}
          />

          <AppTextInput
            label="Phone"
            value={phone}
            onChangeText={value => { setPhone(normalizeInternationalPhoneInput(value)); setPhoneError(null); }}
            placeholder="Phone number with country code"
            keyboardType="phone-pad"
            maxLength={16}
            error={phoneError ?? undefined}
          />

          <AppTextInput
            label="Website"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Business Address" />

          <AppTextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter business address"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Tax Information" />

          <AppTextInput
            label="Tax number"
            value={taxNumber}
            onChangeText={setTaxNumber}
            placeholder="Optional tax / GST number"
            autoCapitalize="characters"
            autoCorrect={false}
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

  section: {
    marginTop: spacing.sm,
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


