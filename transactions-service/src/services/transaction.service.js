'use strict';

const db = require('../db/database');

// Categorías válidas para evitar datos basura en la tabla
const VALID_CATEGORIES = [
  'alimentacion',
  'comida',
  'transporte',
  'vivienda',
  'salud',
  'entretenimiento',
  'ocio',
  'educacion',
  'ropa',
  'servicios',
  'otros',
];

const CATEGORY_ALIASES = {
  ocio: 'entretenimiento',
  comida: 'comida',
};

/**
 * Normaliza una categoría: quita espacios, pasa a minúsculas y remueve tildes.
 */
function normalizeCategory(cat) {
  if (typeof cat !== 'string') return '';
  const clean = cat.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CATEGORY_ALIASES[clean] || clean;
}

/**
 * Crea una nueva transacción para el usuario autenticado.
 * @param {number} userId
 * @param {{ amount: number, category: string, description?: string, date: string }} data
 * @returns {{ id: number, user_id: number, amount: number, category: string, description: string|null, date: string, created_at: string }}
 * @throws {Error} si los datos son inválidos
 */
function create(userId, { amount, category, description = null, date }) {
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    const err = new Error('amount debe ser un número positivo.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedCategory = normalizeCategory(category);
  if (!VALID_CATEGORIES.includes(normalizedCategory)) {
    const err = new Error(
      `category inválida. Valores permitidos: ${VALID_CATEGORIES.join(', ')}.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Validar formato de fecha ISO 8601 (YYYY-MM-DD)
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const err = new Error('date debe tener el formato YYYY-MM-DD.');
    err.statusCode = 400;
    throw err;
  }

  const stmt = db.prepare(
    `INSERT INTO transactions (user_id, amount, category, description, date)
     VALUES (?, ?, ?, ?, ?)`
  );
  const result = stmt.run(userId, amount, normalizedCategory, description, date);

  return findById(result.lastInsertRowid);
}

/**
 * Lista las transacciones del usuario autenticado con filtros opcionales.
 * @param {number} userId
 * @param {{ category?: string, from?: string, to?: string, limit?: number, offset?: number }} filters
 * @returns {Array}
 */
function list(userId, { category, from, to, limit = 50, offset = 0 } = {}) {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (category) {
    conditions.push('category = ?');
    params.push(category.trim().toLowerCase());
  }
  if (from) {
    conditions.push('date >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('date <= ?');
    params.push(to);
  }

  const safeLimit = Math.min(Number(limit) || 50, 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const sql = `
    SELECT id, user_id, amount, category, description, date, created_at
    FROM transactions
    WHERE ${conditions.join(' AND ')}
    ORDER BY date DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  return db.prepare(sql).all(...params, safeLimit, safeOffset);
}

/**
 * Busca una transacción por ID.
 * @param {number} id
 * @returns {object|undefined}
 */
function findById(id) {
  return db
    .prepare(
      'SELECT id, user_id, amount, category, description, date, created_at FROM transactions WHERE id = ?'
    )
    .get(id);
}

module.exports = { create, list, findById, VALID_CATEGORIES };
