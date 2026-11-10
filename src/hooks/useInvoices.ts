import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    getInvoices,
} from '../database/repositories/invoiceRepository';
import {
    getCustomerById,
} from '../database/repositories/customerRepository';
import type {
    Customer,
    Invoice,
} from '../database/types';

export type InvoicePaymentStatus =
    | 'unpaid'
    | 'partial'
    | 'paid';

export type InvoiceSort =
    | 'newest'
    | 'oldest'
    | 'invoice_number'
    | 'total';

export type InvoiceListItem = {
    invoice: Invoice;
    customer: Customer | null;
};

type UseInvoicesResult = {
    invoices: InvoiceListItem[];
    isLoading: boolean;
    error: string | null;
    refreshInvoices: () => Promise<void>;
};

function getPaymentStatus(
    paidMinor: number,
    totalMinor: number,
): InvoicePaymentStatus {
    if (paidMinor <= 0) {
        return 'unpaid';
    }

    if (paidMinor >= totalMinor) {
        return 'paid';
    }

    return 'partial';
}

export function useInvoices(): UseInvoicesResult {
    const [invoices, setInvoices] =
        useState<InvoiceListItem[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const refreshInvoices = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const results = await getInvoices();

            const invoicesWithCustomers =
                await Promise.all(
                    results.map(async invoice => {
                        if (invoice.customer_id === null) {
                            return {
                                invoice,
                                customer: null,
                            };
                        }

                        const customer =
                            await getCustomerById(
                                invoice.customer_id,
                            );

                        return {
                            invoice,
                            customer: customer ?? null,
                        };
                    }),
                );

            setInvoices(invoicesWithCustomers);
        } catch (err) {
            console.error(
                'Failed to load invoices:',
                err,
            );

            setInvoices([]);

            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load invoices.',
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshInvoices();
    }, [refreshInvoices]);

    return {
        invoices,
        isLoading,
        error,
        refreshInvoices,
    };
}

export {
    getPaymentStatus,
};