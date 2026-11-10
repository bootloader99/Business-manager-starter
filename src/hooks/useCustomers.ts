import { useCallback, useEffect, useState } from 'react';
import {
    archiveCustomer,
    createCustomer,
    getCustomers,
    updateCustomer,
    type CreateCustomerInput,
} from '../database/repositories/customerRepository';
import type { Customer } from '../database/types';

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCustomers = useCallback(async () => {
        try {
            setError(null);
            const result = await getCustomers();
            setCustomers(result);
        } catch (err) {
            console.error('Failed to load customers:', err);
            setError('Unable to load customers.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const addCustomer = useCallback(
        async (input: CreateCustomerInput) => {
            await createCustomer(input);
            await loadCustomers();
        },
        [loadCustomers],
    );

    const editCustomer = useCallback(
        async (id: number, input: CreateCustomerInput) => {
            await updateCustomer(id, input);
            await loadCustomers();
        },
        [loadCustomers],
    );

    const removeCustomer = useCallback(
        async (id: number) => {
            await archiveCustomer(id);
            await loadCustomers();
        },
        [loadCustomers],
    );

    return {
        customers,
        isLoading,
        error,
        refreshCustomers: loadCustomers,
        addCustomer,
        editCustomer,
        removeCustomer,
    };
}