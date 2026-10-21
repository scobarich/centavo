'use strict';

const transactionService = require('../services/transaction.service');

/**
 * POST /transactions
 * Body: { amount, category, description?, date }
 * Requiere verifySession (adjunta req.user).
 */
function create(req, res) {
  const { amount, category, description, date } = req.body;

  if (amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'amount, category y date son requeridos.' });
  }

  const parsedAmount = Number(amount);
  if (!isFinite(parsedAmount)) {
    return res.status(400).json({ error: 'amount debe ser un número.' });
  }

  try {
    const transaction = transactionService.create(req.user.id, {
      amount: parsedAmount,
      category,
      description: description ?? null,
      date,
    });
    return res.status(201).json({
      message: 'Transacción registrada exitosamente.',
      transaction,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * GET /transactions
 * Query params opcionales: category, from (YYYY-MM-DD), to (YYYY-MM-DD), limit, offset
 * Requiere verifySession (adjunta req.user).
 */
function list(req, res) {
  const { category, from, to, limit, offset } = req.query;

  try {
    const transactions = transactionService.list(req.user.id, {
      category,
      from,
      to,
      limit,
      offset,
    });
    return res.status(200).json({ transactions });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * GET /transactions/:id
 * Requiere verifySession. Solo devuelve la transacción si pertenece al usuario.
 */
function getById(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de transacción inválido.' });
  }

  try {
    const transaction = transactionService.findById(id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada.' });
    }

    // Garantizar que el usuario solo acceda a sus propias transacciones
    if (transaction.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    return res.status(200).json({ transaction });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = { create, list, getById };
