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
import type { Customer } from '../../../database/types';
import { radius, spacing, typography, useTheme, type AppTheme } from '../../../theme';
import { fontFamily } from '../../../theme/typography';

type Props = {
    customers: Customer[];
    selectedCustomerId: number | null;
    onChange: (customerId: number | null) => void;
    disabled?: boolean;
};

export function CustomerSelector({
    customers,
    selectedCustomerId,
    onChange,
    disabled = false,
}: Props) {
    const { theme } = useTheme();
    const styles = createStyles(theme.colors);
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState('');

    const selectedCustomer = useMemo(
        () =>
            customers.find(
                customer => customer.id === selectedCustomerId,
            ) ?? null,
        [customers, selectedCustomerId],
    );

    const filteredCustomers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return customers;
        }

        return customers.filter(customer => {
            return (
                customer.name.toLowerCase().includes(query) ||
                customer.phone?.toLowerCase().includes(query) ||
                customer.company_name?.toLowerCase().includes(query)
            );
        });
    }, [customers, search]);

    function close() {
        setVisible(false);
        setSearch('');
    }

    function selectCustomer(customerId: number | null) {
        onChange(customerId);
        close();
    }

    return (
        <>
            <AppCard
                onPress={disabled ? undefined : () => setVisible(true)}
                disabled={disabled}
                style={styles.selectorCard}>
                <View style={styles.selectorContent}>
                    <Text style={styles.selectorTitle}>
                        {selectedCustomer?.name ?? 'Walk-in customer'}
                    </Text>

                    {selectedCustomer?.company_name ? (
                        <Text style={styles.selectorSubtitle}>
                            {selectedCustomer.company_name}
                        </Text>
                    ) : selectedCustomer?.phone ? (
                        <Text style={styles.selectorSubtitle}>
                            {selectedCustomer.phone}
                        </Text>
                    ) : !selectedCustomer ? (
                        <Text style={styles.selectorSubtitle}>
                            No customer record
                        </Text>
                    ) : null}
                </View>

                <Text style={styles.chevron}>›</Text>
            </AppCard>

            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={close}>
                <View style={styles.overlay}>
                    <View style={styles.sheet}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Select customer</Text>
                                <Text style={styles.subtitle}>
                                    Choose a customer for this transaction.
                                </Text>
                            </View>

                            <Pressable onPress={close} hitSlop={8}>
                                <Text style={styles.closeText}>Close</Text>
                            </Pressable>
                        </View>

                        <AppTextInput
                            placeholder="Search customers..."
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                        />

                        <ScrollView
                            style={styles.list}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}>
                            <AppCard
                                onPress={() => selectCustomer(null)}
                                style={[
                                    styles.option,
                                    selectedCustomerId === null &&
                                    styles.optionSelected,
                                ]}>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>
                                        Walk-in customer
                                    </Text>
                                    <Text style={styles.optionMeta}>
                                        No customer record
                                    </Text>
                                </View>

                                {selectedCustomerId === null ? (
                                    <Text style={styles.selectedIndicator}>✓</Text>
                                ) : null}
                            </AppCard>

                            {filteredCustomers.map(customer => (
                                <AppCard
                                    key={customer.id}
                                    onPress={() => selectCustomer(customer.id)}
                                    style={[
                                        styles.option,
                                        customer.id === selectedCustomerId &&
                                        styles.optionSelected,
                                    ]}>
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionTitle}>
                                            {customer.name}
                                        </Text>

                                        {customer.company_name ? (
                                            <Text style={styles.optionMeta}>
                                                {customer.company_name}
                                            </Text>
                                        ) : customer.phone ? (
                                            <Text style={styles.optionMeta}>
                                                {customer.phone}
                                            </Text>
                                        ) : null}
                                    </View>

                                    {customer.id === selectedCustomerId ? (
                                        <Text style={styles.selectedIndicator}>
                                            ✓
                                        </Text>
                                    ) : null}
                                </AppCard>
                            ))}

                            {filteredCustomers.length === 0 ? (
                                <EmptyState
                                    title="No customers found"
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
        </>
    );
}
const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
    selectorCard: {
        minHeight: 72,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.lg,
    },

    selectorContent: {
        flex: 1,
        minWidth: 0,
        paddingRight: spacing.sm,
        gap: 3,
    },

    selectorTitle: {
        ...typography.body,
        fontFamily: fontFamily.semiBold,
        color: colors.textPrimary,
    },

    selectorSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },

    chevron: {
        fontFamily: fontFamily.regular,
        fontSize: 24,
        lineHeight: 28,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },

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
        borderRadius: radius.lg,
    },

    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },

    optionContent: {
        flex: 1,
        minWidth: 0,
        gap: 3,
    },

    optionTitle: {
        ...typography.body,
        fontFamily: fontFamily.semiBold,
        color: colors.textPrimary,
    },

    optionMeta: {
        ...typography.caption,
        color: colors.textSecondary,
    },

    selectedIndicator: {
        fontFamily: fontFamily.semiBold,
        fontSize: 18,
        lineHeight: 24,
        color: colors.primary,
        marginLeft: spacing.sm,
    },
});