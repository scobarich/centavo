import { apiRequest } from './api';

/**
 * Servicio para comunicación con transactions-service.
 */
export const transactionService = {
  /**
   * Obtiene la lista de transacciones del usuario autenticado.
   * Retorna un arreglo de transacciones.
   */
  async getTransactions() {
    try {
      const data = await apiRequest('/transactions');
      // El backend devuelve { transactions: [...] }
      return Array.isArray(data) ? data : (data.transactions || []);
    } catch (err) {
      // En modo desarrollo sin backend activo, retorna listado vacío como scaffold
      return [];
    }
  },

  /**
   * Registra una nueva transacción para el usuario autenticado.
   * @param {{ amount: number, category: string, description?: string, date: string }} payload
   */
  async createTransaction(payload) {
    return await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
