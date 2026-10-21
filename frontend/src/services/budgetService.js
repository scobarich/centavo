import { apiRequest } from './api';

/**
 * Servicio para comunicación con budgets-service.
 */
export const budgetService = {
  /**
   * Obtiene el presupuesto del mes actual (o el especificado) para el usuario autenticado.
   * @param {string} [month] Formato YYYY-MM
   */
  async getMonthlyBudget(month) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    try {
      const data = await apiRequest(`/budgets?month=${encodeURIComponent(currentMonth)}`);
      return Number(data?.budget?.amount) || 0;
    } catch {
      // Fallback a localStorage si el servicio no responde
      const saved = localStorage.getItem(`centavo_budget_${currentMonth}`);
      return saved !== null ? Number(saved) : 0;
    }
  },

  /**
   * Actualiza el presupuesto mensual del usuario autenticado.
   * @param {number} amount Monto del presupuesto
   * @param {string} [month] Formato YYYY-MM
   */
  async setMonthlyBudget(amount, month) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    const parsedAmount = Number(amount);
    localStorage.setItem(`centavo_budget_${currentMonth}`, String(parsedAmount));

    try {
      const data = await apiRequest('/budgets', {
        method: 'POST',
        body: JSON.stringify({ amount: parsedAmount, month: currentMonth }),
      });
      return Number(data?.budget?.amount) || parsedAmount;
    } catch {
      return parsedAmount;
    }
  },
};
