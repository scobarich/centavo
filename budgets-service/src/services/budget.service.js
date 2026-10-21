'use strict';

const db = require('../db/database');

/**
 * Obtiene el presupuesto de un usuario para un mes específico.
 * @param {number} userId
 * @param {string} month YYYY-MM
 * @param {string} category Por defecto 'global'
 */
function getBudget(userId, month, category = 'global') {
  const row = db.prepare(`
    SELECT id, user_id, month, amount, category, created_at
    FROM budgets
    WHERE user_id = ? AND month = ? AND category = ?
  `).get(userId, month, category);

  return row || null;
}

/**
 * Establece o actualiza el presupuesto de un usuario para un mes dado.
 * @param {number} userId
 * @param {{ month: string, amount: number, category?: string }} data
 */
function setBudget(userId, { month, amount, category = 'global' }) {
  const parsedAmount = Number(amount);
  if (!isFinite(parsedAmount) || parsedAmount < 0) {
    const err = new Error('amount debe ser un número mayor o igual a 0.');
    err.statusCode = 400;
    throw err;
  }

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const err = new Error('month debe tener el formato YYYY-MM.');
    err.statusCode = 400;
    throw err;
  }

  const stmt = db.prepare(`
    INSERT INTO budgets (user_id, month, amount, category)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, month, category)
    DO UPDATE SET amount = excluded.amount, created_at = datetime('now')
  `);

  stmt.run(userId, month, parsedAmount, category);
  return getBudget(userId, month, category);
}

module.exports = { getBudget, setBudget };
