import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    createPayment,
    getPaymentsByInvoiceId,
    type CreatePaymentInput,
} from '../database/repositories/paymentRepository';
import type { Payment } from '../database/types';

type UsePaymentsResult = {
    payments: Payment[];
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    refreshPayments: () => Promise<void>;
    addPayment: (
        input: Omit<CreatePaymentInput, 'invoice_id'>,
    ) => Promise<Payment>;
};

export function usePayments(
    invoiceId: number,
): UsePaymentsResult {
    const [payments, setPayments] = useState<
        Payment[]
    >([]);
    const [isLoading, setIsLoading] =
        useState(true);
    const [isSaving, setIsSaving] =
        useState(false);
    const [error, setError] = useState<
        string | null
    >(null);

    const refreshPayments =
        useCallback(async () => {
            try {
                setIsLoading(true);
                setError(null);

                const result =
                    await getPaymentsByInvoiceId(
                        invoiceId,
                    );

                setPayments(result);
            } catch (err) {
                console.error(
                    'Failed to load payments:',
                    err,
                );

                setPayments([]);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load payments.',
                );
            } finally {
                setIsLoading(false);
            }
        }, [invoiceId]);

    useEffect(() => {
        refreshPayments();
    }, [refreshPayments]);

    const addPayment = useCallback(
        async (
            input: Omit<CreatePaymentInput, 'invoice_id'>,
        ) => {
            try {
                setIsSaving(true);
                setError(null);

                const payment =
                    await createPayment({
                        ...input,
                        invoice_id: invoiceId,
                    });

                await refreshPayments();

                return payment;
            } catch (err) {
                console.error(
                    'Failed to create payment:',
                    err,
                );

                const message =
                    err instanceof Error
                        ? err.message
                        : 'Unable to save payment.';

                setError(message);
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        [invoiceId, refreshPayments],
    );

    return {
        payments,
        isLoading,
        isSaving,
        error,
        refreshPayments,
        addPayment,
    };
}