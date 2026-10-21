'use strict';

const db = require('../db/database');

const BUDGETS_SERVICE_URL = process.env.BUDGETS_SERVICE_URL || 'http://localhost:3003';
const TRANSACTIONS_SERVICE_URL = process.env.TRANSACTIONS_SERVICE_URL || 'http://localhost:3002';

/**
 * Normaliza categorías según convención de Centavo.
 */
function normalizeCategory(cat) {
  if (typeof cat !== 'string') return 'global';
  const clean = cat.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aliases = {
    ocio: 'entretenimiento',
    comida: 'comida',
  };
  return aliases[clean] || clean;
}

/**
 * Consulta el presupuesto correspondiente en budgets-service.
 * Si no encuentra por categoría específica, intenta con 'global'.
 */
async function fetchBudget(userId, month, category, authHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    // 1. Intentar presupuesto de categoría específica
    let url = `${BUDGETS_SERVICE_URL}/budgets?month=${encodeURIComponent(month)}&category=${encodeURIComponent(category)}`;
    let response = await fetch(url, { headers });

    if (response.ok) {
      const data = await response.json();
      const amount = Number(data?.budget?.amount);
      if (isFinite(amount) && amount > 0) {
        return { amount, category };
      }
    }

    // 2. Si la categoría no es 'global', buscar presupuesto global
    if (category !== 'global') {
      url = `${BUDGETS_SERVICE_URL}/budgets?month=${encodeURIComponent(month)}&category=global`;
      response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const amount = Number(data?.budget?.amount);
        if (isFinite(amount) && amount > 0) {
          return { amount, category: 'global' };
        }
      }
    }
  } catch (err) {
    console.warn(`[notifications-service] No se pudo conectar con budgets-service: ${err.message}`);
  }

  return { amount: 0, category };
}

/**
 * Consulta las transacciones acumuladas del mes en transactions-service.
 */
async function fetchTotalSpent(userId, month, category, authHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const from = `${month}-01`;
    const to = `${month}-31`;
    const url = `${TRANSACTIONS_SERVICE_URL}/transactions?from=${from}&to=${to}&limit=200`;
    const response = await fetch(url, { headers });

    if (response.ok) {
      const data = await response.json();
      const txs = Array.isArray(data) ? data : (data.transactions || []);
      
      return txs
        .filter((tx) => {
          if (!category || category === 'global') return true;
          return normalizeCategory(tx.category) === category;
        })
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    }
  } catch (err) {
    console.warn(`[notifications-service] No se pudo conectar con transactions-service: ${err.message}`);
  }

  return 0;
}

/**
 * Guarda una nueva notificación en la base de datos.
 */
function createNotification(userId, { type, title, message, category, amount, budgetAmount, totalSpent, month }) {
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, category, amount, budget_amount, total_spent, month)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    userId,
    type,
    title,
    message,
    category || 'global',
    amount,
    budgetAmount,
    totalSpent,
    month
  );

  return findById(result.lastInsertRowid);
}

/**
 * Evalúa un evento de nueva transacción contra el presupuesto correspondiente.
 * Genera y almacena una alerta si el gasto supera o pone en riesgo el presupuesto.
 *
 * @param {number} userId
 * @param {{ amount: number, category?: string, date?: string, currentTotalSpent?: number, budgetAmount?: number, description?: string }} data
 * @param {string} [authHeader] Encabezado de autenticación opcional para llamadas inter-servicio
 */
async function evaluateTransaction(userId, data, authHeader) {
  const amount = Number(data.amount);
  if (!isFinite(amount) || amount <= 0) {
    const err = new Error('amount debe ser un número positivo.');
    err.statusCode = 400;
    throw err;
  }

  const category = normalizeCategory(data.category);
  const date = data.date || new Date().toISOString().split('T')[0];
  const month = date.slice(0, 7);

  // 1. Obtener el presupuesto correspondiente (del payload o de budgets-service)
  let budgetAmount = data.budgetAmount !== undefined ? Number(data.budgetAmount) : null;
  let budgetCategory = category;

  if (budgetAmount === null || !isFinite(budgetAmount)) {
    const budgetInfo = await fetchBudget(userId, month, category, authHeader);
    budgetAmount = budgetInfo.amount;
    budgetCategory = budgetInfo.category;
  }

  // 2. Obtener el gasto total acumulado en el mes
  let totalSpent;
  if (data.currentTotalSpent !== undefined && isFinite(Number(data.currentTotalSpent))) {
    // Si ya viene calculado desde el emisor
    totalSpent = Number(data.currentTotalSpent) + (data.alreadyIncluded ? 0 : amount);
  } else {
    // Consultar histórico en transactions-service y sumarle la nueva transacción
    const previousSpent = await fetchTotalSpent(userId, month, budgetCategory, authHeader);
    totalSpent = previousSpent + (data.alreadyIncluded ? 0 : amount);
  }

  // 3. Determinar si se debe generar una alerta
  if (budgetAmount > 0) {
    const percentage = (totalSpent / budgetAmount) * 100;
    let alert = null;

    if (totalSpent > budgetAmount) {
      // Alerta de sobregasto (Límite superado)
      alert = createNotification(userId, {
        type: 'budget_exceeded',
        title: `¡Alerta de sobregasto en ${category}!`,
        message: `Has superado tu presupuesto de ${category} para ${month}. Límite: $${budgetAmount.toFixed(2)}, Total gastado: $${totalSpent.toFixed(2)}.`,
        category,
        amount,
        budgetAmount,
        totalSpent,
        month,
      });

      return {
        alertGenerated: true,
        alert,
        evaluation: {
          month,
          category,
          budgetCategory,
          transactionAmount: amount,
          totalSpent,
          budgetAmount,
          percentage: Number(percentage.toFixed(2)),
          status: 'exceeded',
        },
      };
    } else if (percentage >= 80) {
      // Alerta preventiva (Umbral del 80% alcanzado)
      alert = createNotification(userId, {
        type: 'budget_warning',
        title: `Advertencia: 80% del presupuesto alcanzado en ${category}`,
        message: `Has alcanzado el ${percentage.toFixed(1)}% de tu presupuesto de ${category} para ${month}. Has consumido $${totalSpent.toFixed(2)} de $${budgetAmount.toFixed(2)}.`,
        category,
        amount,
        budgetAmount,
        totalSpent,
        month,
      });

      return {
        alertGenerated: true,
        alert,
        evaluation: {
          month,
          category,
          budgetCategory,
          transactionAmount: amount,
          totalSpent,
          budgetAmount,
          percentage: Number(percentage.toFixed(2)),
          status: 'warning',
        },
      };
    }

    return {
      alertGenerated: false,
      message: 'La transacción se encuentra dentro de los límites del presupuesto.',
      evaluation: {
        month,
        category,
        budgetCategory,
        transactionAmount: amount,
        totalSpent,
        budgetAmount,
        percentage: Number(percentage.toFixed(2)),
        status: 'ok',
      },
    };
  }

  // Si no hay presupuesto configurado para ese mes/categoría
  return {
    alertGenerated: false,
    message: 'No existe un presupuesto configurado para este período o categoría.',
    evaluation: {
      month,
      category,
      transactionAmount: amount,
      totalSpent,
      budgetAmount: 0,
      percentage: 0,
      status: 'no_budget',
    },
  };
}

/**
 * Busca una notificación por ID.
 */
function findById(id) {
  return db
    .prepare(
      'SELECT id, user_id, type, title, message, category, amount, budget_amount, total_spent, month, read, created_at FROM notifications WHERE id = ?'
    )
    .get(id);
}

/**
 * Lista las notificaciones de un usuario con filtros opcionales.
 */
function list(userId, { read, limit = 50, offset = 0 } = {}) {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (read !== undefined && read !== null) {
    conditions.push('read = ?');
    params.push(read === 'true' || read === 1 || read === '1' ? 1 : 0);
  }

  const safeLimit = Math.min(Number(limit) || 50, 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const sql = `
    SELECT id, user_id, type, title, message, category, amount, budget_amount, total_spent, month, read, created_at
    FROM notifications
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  return db.prepare(sql).all(...params, safeLimit, safeOffset);
}

/**
 * Marca una notificación como leída.
 */
function markAsRead(id, userId) {
  const notification = findById(id);
  if (!notification) return null;

  if (notification.user_id !== userId) {
    const err = new Error('Acceso denegado.');
    err.statusCode = 403;
    throw err;
  }

  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  return findById(id);
}

module.exports = {
  evaluateTransaction,
  createNotification,
  list,
  findById,
  markAsRead,
  normalizeCategory,
};
