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
  ConfirmationModal,
  EmptyState,
  LoadingState,
  ScreenContainer,
  SectionHeader,
  useAppToast,
} from '../../components';
import {
  archiveCustomer,
  getCustomerById,
} from '../../database/repositories/customerRepository';
import type { Customer } from '../../database/types';
import { Routes } from '../../constants';
import type { CustomersStackParamList } from '../../navigation/types';
import {
  radius,
  spacing,
  typography,
  useTheme,
} from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { fontFamily } from '../../theme/typography';

type Props = NativeStackScreenProps<
  CustomersStackParamList,
  'CustomerDetails'
>;

type Nav = NativeStackNavigationProp<
  CustomersStackParamList,
  'CustomerDetails'
>;

export default function CustomerDetailsScreen({ route }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();

  const customerId = Number(route.params.customerId);

  const [showArchiveConfirmation, setShowArchiveConfirmation] =
    useState(false);

  const { showToast } = useAppToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadCustomer = async () => {
      setIsLoading(true);

      try {
        setError(null);

        const result = await getCustomerById(customerId);

        if (!result || result.is_archived) {
          setError('Customer not found.');
          setCustomer(null);
          return;
        }

        setCustomer(result);
      } catch (err) {
        console.error('Failed to load customer:', err);
        setError('Unable to load customer.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [customerId, isFocused]);

  const handleArchive = () => {
    if (!customer || isArchiving) {
      return;
    }

    setShowArchiveConfirmation(true);
  };

  const handleConfirmArchive = async () => {
    if (!customer || isArchiving) {
      return;
    }

    try {
      setIsArchiving(true);

      await archiveCustomer(customer.id);

      setShowArchiveConfirmation(false);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to archive customer:', err);

      setShowArchiveConfirmation(false);

      showToast({
        message:
          err instanceof Error
            ? err.message
            : 'Something went wrong while archiving the customer.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Customer">
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (error || !customer) {
    return (
      <ScreenContainer title="Customer" scroll={false}>
        <EmptyState
          title="Customer unavailable"
          message={
            error ?? 'This customer could not be found.'
          }
          actionLabel="Go back"
          onActionPress={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  const contactRows = [
    { label: 'Phone', value: customer.phone },
    { label: 'Email', value: customer.email },
  ].filter(row => hasValue(row.value));

  const businessRows = [
    { label: 'Tax number', value: customer.tax_number },
    { label: 'Address', value: customer.address },
  ].filter(row => hasValue(row.value));

  const hasContactInfo = contactRows.length > 0;
  const hasBusinessInfo = businessRows.length > 0;
  const hasNotes = hasValue(customer.notes);

  const hasAdditionalInfo =
    hasContactInfo || hasBusinessInfo || hasNotes;

  return (
    <>
      <ScreenContainer
        title="Customer"
        scroll={false}
        contentStyle={styles.screenContent}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: spacing.xl },
          ]}
        >
          <AppCard style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(customer.name)}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.name}>
                  {customer.name}
                </Text>
                {hasValue(customer.company_name) ? (
                  <Text style={styles.company}>
                    {customer.company_name?.trim()}
                  </Text>
                ) : null}
              </View>
            </View>

            {hasContactInfo ? (
              <View style={styles.primaryContact}>
                {hasValue(customer.phone) ? (
                  <InfoRow
                    label="Phone"
                    value={customer.phone}
                  />
                ) : null}

                {hasValue(customer.email) ? (
                  <InfoRow
                    label="Email"
                    value={customer.email}
                  />
                ) : null}
              </View>
            ) : null}
          </AppCard>

          {hasBusinessInfo ? (
            <InfoSection title="Business information">
              {businessRows.map(row => (
                <InfoRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </InfoSection>
          ) : null}

          {hasNotes ? (
            <InfoSection title="Notes">
              <Text style={styles.notes}>
                {customer.notes!.trim()}
              </Text>
            </InfoSection>
          ) : null}

          {!hasAdditionalInfo ? (
            <View style={styles.emptyDetails}>
              <Text style={styles.emptyDetailsTitle}>
                No additional details
              </Text>
              <Text style={styles.emptyDetailsMessage}>
                Add contact information, a business address, or notes to keep everything together.
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title="Edit customer"
              onPress={() =>
                navigation.navigate(Routes.CustomerForm, {
                  customerId: String(customer.id),
                })
              }
            />

            <View style={styles.secondaryAction}>
              <AppButton
                title="Archive customer"
                variant="dangerOutline"
                onPress={handleArchive}
                loading={isArchiving}
                disabled={isArchiving}
              />
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
      <ConfirmationModal
        visible={showArchiveConfirmation}
        title="Archive customer?"
        message={`${customer.name} will be removed from your active customer list. Existing transactions will be kept.`}
        confirmLabel="Archive"
        destructive
        loading={isArchiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => {
          if (!isArchiving) {
            setShowArchiveConfirmation(false);
          }
        }}
      />
    </>
  );
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

type InfoSectionProps = {
  title: string;
  children: React.ReactNode;
};

function InfoSection({ title, children }: InfoSectionProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <AppCard style={styles.infoCard}>{children}</AppCard>
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string | null | undefined;
};

function InfoRow({ label, value }: InfoRowProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{trimmedValue}</Text>
    </View>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  screenContent: {
    flex: 1,
    padding: 0,
  },

  content: {
    padding: spacing.md,
    gap: spacing.md,
  },

  profileCard: {
    padding: spacing.md,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },

  avatarText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 19,
    lineHeight: 24,
    color: colors.primary,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },

  name: {
    ...typography.section,
    color: colors.textPrimary,
  },

  company: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  primaryContact: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  section: {
    gap: spacing.sm,
  },

  infoCard: {
    paddingHorizontal: spacing.md,
  },

  infoRow: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
  },

  notes: {
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },

  emptyDetails: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },

  emptyDetailsTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  emptyDetailsMessage: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },

  secondaryAction: {
    marginTop: spacing.xs,
  },
});