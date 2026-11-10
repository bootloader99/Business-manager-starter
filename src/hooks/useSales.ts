import {useCallback, useEffect, useState} from 'react';
import {
  createSale,
  getSales,
  type CreateSaleInput,
} from '../database/repositories/saleRepository';
import type {Sale} from '../database/types';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    try {
      setError(null);

      const result = await getSales();
      setSales(result);
    } catch (err) {
      console.error('Failed to load sales:', err);
      setError('Unable to load sales.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const addSale = useCallback(
    async (input: CreateSaleInput) => {
      const saleId = await createSale(input);
      await loadSales();
      return saleId;
    },
    [loadSales],
  );

  const changeSaleStatus = useCallback(
    async (id: number, status: Sale['status']) => {
      // Status updates are kept in the repository so the hook
      // remains responsible only for loading and refreshing data.
      const {updateSaleStatus} = await import(
        '../database/repositories/saleRepository'
      );

      await updateSaleStatus(id, status);
      await loadSales();
    },
    [loadSales],
  );

  return {
    sales,
    isLoading,
    error,
    refreshSales: loadSales,
    addSale,
    changeSaleStatus,
  };
}