import { getTodayDateInput, isValidDateInput } from '../../utils/validation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Pressable,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

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
import { getInvoiceById } from '../../database/repositories/invoiceRepository';
import type { Invoice } from '../../database/types';
import { usePayments } from '../../hooks/usePayments';
import type { MoreStackParamList } from '../../navigation/types';
import { spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils/formatCurrency';

type Props = NativeStackScreenProps<
    MoreStackParamList,
    'RecordPayment'
>;

export default function RecordPaymentScreen({
    route,
    navigation,
}: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

    const { showToast } = useAppToast();
    const invoiceId = Number(route.params.invoiceId);

    const {
        addPayment,
        isSaving,
    } = usePayments(invoiceId);

    const [invoice, setInvoice] =
        useState<Invoice | null>(null);
    const [isLoading, setIsLoading] =
        useState(true);
    const [error, setError] =
        useState<string | null>(null);

    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] =
        useState('');
    const [showPaymentMethodPicker, setShowPaymentMethodPicker] = useState(false);
    const [customPaymentMethod, setCustomPaymentMethod] = useState('');

    const paymentMethodOptions = ['Cash', 'Bank transfer', 'Card', 'UPI', 'Cheque', 'Other'] as const;
    const isCustomPaymentMethod = paymentMethod === 'Other';
    const resolvedPaymentMethod = isCustomPaymentMethod ? customPaymentMethod.trim() : paymentMethod.trim();
    const [paymentDate, setPaymentDate] =
        useState(getTodayDateInput());
    const [reference, setReference] =
        useState('');
    const [notes, setNotes] = useState('');

    const loadInvoice = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!Number.isInteger(invoiceId)) {
                throw new Error('Invalid invoice.');
            }

            const result =
                await getInvoiceById(invoiceId);

            if (!result) {
                throw new Error('Invoice not found.');
            }

            setInvoice(result.invoice);
        } catch (err) {
            console.error(
                'Failed to load invoice for payment:',
                err,
            );

            setInvoice(null);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load invoice.',
            );
        } finally {
            setIsLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => {
        loadInvoice();
    }, [loadInvoice]);

    const remainingMinor = useMemo(() => {
        if (!invoice) {
            return 0;
        }

        return Math.max(
            0,
            invoice.total_minor - invoice.paid_minor,
        );
    }, [invoice]);

        async function handleSave() {
        if (!invoice) {
            return;
        }

        if (invoice.status !== 'issued') {
            showToast({
                message: 'Payments can only be recorded for issued invoices.',
                type: 'info',
            });
            return;
        }

        if (remainingMinor <= 0) {
            showToast({ message: 'This invoice has no remaining balance.', type: 'info' });
            return;
        }

        const parsedAmount = Number(amount);

        if (
            !Number.isFinite(parsedAmount) ||
            parsedAmount <= 0
        ) {
            showToast({ message: 'Enter a payment amount greater than zero.', type: 'error' });
            return;
        }

        const amountMinor = Math.round(
            parsedAmount * 100,
        );

        if (amountMinor > remainingMinor) {
            showToast({
                message: `The maximum payment is ${formatCurrency(remainingMinor)}.`,
                type: 'error',
            });
            return;
        }

        if (!resolvedPaymentMethod) {
            showToast({ message: 'Enter how the customer paid.', type: 'error' });
            return;
        }

        if (!isValidDateInput(paymentDate)) {
            showToast({ message: 'Enter the payment date in YYYY-MM-DD format.', type: 'error' });
            return;
        }

        try {
            await addPayment({
                amount_minor: amountMinor,
                payment_method:
                    resolvedPaymentMethod,
                payment_date: paymentDate,
                reference:
                    reference.trim() || null,
                notes: notes.trim() || null,
            });

            showToast({ message: 'The payment has been recorded successfully.', type: 'success' });
            navigation.goBack();
        } catch (err) {
            console.error(
                'Failed to record payment:',
                err,
            );

            showToast({
                message: err instanceof Error ? err.message : 'Something went wrong while recording the payment.',
                type: 'error',
                duration: 4000,
            });
        }
    }

    if (isLoading) {
        return <LoadingState fullscreen />;
    }

    if (error || !invoice) {
        return (
            <View style={styles.errorContainer}>
                <EmptyState
                    title="Unable to load invoice"
                    message={
                        error ?? 'Invoice not found.'
                    }
                    actionLabel="Try Again"
                    onActionPress={loadInvoice}
                />
            </View>
        );
    }

    if (invoice.status !== 'issued') {
        return (
            <View style={styles.errorContainer}>
                <EmptyState
                    title="Payment unavailable"
                    message="Payments can only be recorded for issued invoices."
                    actionLabel="Go Back"
                    onActionPress={() =>
                        navigation.goBack()
                    }
                />
            </View>
        );
    }

    if (remainingMinor <= 0) {
        return (
            <View style={styles.errorContainer}>
                <EmptyState
                    title="Invoice already paid"
                    message="This invoice has no remaining balance."
                    actionLabel="Go Back"
                    onActionPress={() =>
                        navigation.goBack()
                    }
                />
            </View>
        );
    }

    return (
        <ScreenContainer
            title="Record Payment"
            scroll={false}>
            <KeyboardAvoidingView
                style={styles.root}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }>
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <Text style={styles.subtitleText}>
                        Invoice {invoice.invoice_number}
                    </Text>
                    <View style={styles.section}>
                        <SummaryCard
                            rows={[
                                {
                                    label: 'Invoice total',
                                    value: formatCurrency(
                                        invoice.total_minor,
                                    ),
                                },
                                {
                                    label: 'Already paid',
                                    value: formatCurrency(
                                        invoice.paid_minor,
                                    ),
                                },
                                {
                                    label: 'Remaining balance',
                                    value: formatCurrency(
                                        remainingMinor,
                                    ),
                                    emphasized: true,
                                },
                            ]}
                        />
                    </View>

                    <View style={styles.section}>
                        <SectionHeader title="Payment Details" />

                        <AppTextInput
                            label="Amount"
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            suffix="₹"
                            editable={!isSaving}
                            required
                        />

                        <Text style={styles.fieldLabel}>Payment Method *</Text>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Payment method: ${paymentMethod || 'Choose payment method'}`}
                            onPress={() => setShowPaymentMethodPicker(true)}
                            disabled={isSaving}
                            style={styles.methodSelector}
                        >
                            <Text style={[styles.methodSelectorText, !paymentMethod && styles.methodPlaceholder]}>
                                {paymentMethod || 'Choose payment method'}
                            </Text>
                            <Text style={styles.methodChevron}>⌄</Text>
                        </Pressable>
                        {isCustomPaymentMethod ? (
                            <AppTextInput
                                label="Custom payment method"
                                value={customPaymentMethod}
                                onChangeText={setCustomPaymentMethod}
                                placeholder="Enter payment method"
                                editable={!isSaving}
                                required
                            />
                        ) : null}

                        <DateInput
                            label="Payment Date"
                            value={paymentDate}
                            onChangeText={setPaymentDate}
                            placeholder="YYYY-MM-DD"
                            editable={!isSaving}
                            required
                        />

                        <AppTextInput
                            label="Reference"
                            value={reference}
                            onChangeText={setReference}
                            placeholder="Optional transaction/reference number"
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

                    <AppButton
                        title="Record Payment"
                        onPress={handleSave}
                        loading={isSaving}
                        disabled={isSaving}
                        style={styles.saveButton}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
            <Modal
                visible={showPaymentMethodPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPaymentMethodPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setShowPaymentMethodPicker(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close payment method picker"
                    />
                    <View style={styles.methodSheet}>
                        <Text style={styles.methodSheetTitle}>Choose payment method</Text>
                        {paymentMethodOptions.map(option => (
                            <Pressable
                                key={option}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: paymentMethod === option }}
                                style={[styles.methodOption, paymentMethod === option && styles.methodOptionSelected]}
                                onPress={() => {
                                    setPaymentMethod(option);
                                    if (option !== 'Other') setCustomPaymentMethod('');
                                    setShowPaymentMethodPicker(false);
                                }}
                            >
                                <Text style={[styles.methodOptionText, paymentMethod === option && styles.methodOptionTextSelected]}>{option}</Text>
                                {paymentMethod === option ? <Text style={styles.methodCheck}>✓</Text> : null}
                            </Pressable>
                        ))}
                        <AppButton title="Cancel" variant="secondary" onPress={() => setShowPaymentMethodPicker(false)} />
                    </View>
                </View>
            </Modal>
        </ScreenContainer>
    );
}


const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },


    content: {
        paddingHorizontal: 0,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xl,
    },
    section: {
        marginTop: spacing.md,
    },
    saveButton: {
        marginTop: spacing.xl,
    },
    fieldLabel: {
        ...typography.label,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    methodSelector: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        backgroundColor: colors.inputBackground,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    methodSelectorText: {
        ...typography.body,
        color: colors.textPrimary,
    },
    methodPlaceholder: {
        color: colors.textMuted,
    },
    methodChevron: {
        ...typography.body,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    methodSheet: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.md,
        gap: spacing.xs,
    },
    methodSheetTitle: {
        ...typography.cardTitle,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    methodOption: {
        minHeight: 48,
        borderRadius: 10,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    methodOptionSelected: {
        backgroundColor: colors.primaryLight,
    },
    methodOptionText: {
        ...typography.body,
        color: colors.textPrimary,
    },
    methodOptionTextSelected: {
        color: colors.primary,
        fontFamily: typography.label.fontFamily,
    },
    methodCheck: {
        ...typography.body,
        color: colors.primary,
    },

    errorContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: spacing.lg,
    },

    subtitleText: {
        ...typography.secondary,
        color: colors.textSecondary,
    },

});


