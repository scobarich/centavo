import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../services/transactionService';

/**
 * Hook personalizado para manejar el estado y operaciones de transacciones.
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transactionService.getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al obtener transacciones');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const isEmpty = transactions.length === 0 && !isLoading;

  return {
    transactions,
    isLoading,
    error,
    isEmpty,
    refreshTransactions: fetchTransactions,
  };
}
