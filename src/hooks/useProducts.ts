import { useCallback, useEffect, useState } from 'react';
import {
    createProduct,
    deactivateProduct,
    getProducts,
    updateProduct,
    type CreateProductInput,
} from '../database/repositories/productRepository';
import type { Product } from '../database/types';

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        try {
            setError(null);
            const result = await getProducts();
            setProducts(result);
        } catch (err) {
            console.error('Failed to load products:', err);
            setError('Unable to load products.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const addProduct = useCallback(
        async (input: CreateProductInput) => {
            await createProduct(input);
            await loadProducts();
        },
        [loadProducts],
    );

    const editProduct = useCallback(
        async (id: number, input: CreateProductInput) => {
            await updateProduct(id, input);
            await loadProducts();
        },
        [loadProducts],
    );

    const removeProduct = useCallback(
        async (id: number) => {
            await deactivateProduct(id);
            await loadProducts();
        },
        [loadProducts],
    );

    return {
        products,
        isLoading,
        error,
        refreshProducts: loadProducts,
        addProduct,
        editProduct,
        removeProduct,
    };
}