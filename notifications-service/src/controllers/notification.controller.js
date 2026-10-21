'use strict';

const notificationService = require('../services/notification.service');

/**
 * POST /notifications/events/transaction
 * Endpoint que recibe un evento de nueva transacción y determina contra el presupuesto
 * si se debe generar una alerta de sobregasto.
 *
 * Puede ser invocado por transactions-service o por el cliente autenticado.
 */
async function processTransactionEvent(req, res) {
  const userId = req.user?.id || req.body?.userId || req.body?.user_id;

  if (!userId) {
    return res.status(400).json({
      error: 'userId es requerido (en sesión o en el cuerpo del evento).',
    });
  }

  const { amount, category, date, description, currentTotalSpent, budgetAmount, alreadyIncluded } = req.body;

  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: 'amount es requerido.' });
  }

  const parsedAmount = Number(amount);
  if (!isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'amount debe ser un número positivo.' });
  }

  try {
    const authHeader = req.headers['authorization'];
    const result = await notificationService.evaluateTransaction(
      Number(userId),
      {
        amount: parsedAmount,
        category,
        date,
        description,
        currentTotalSpent,
        budgetAmount,
        alreadyIncluded,
      },
      authHeader
    );

    const statusCode = result.alertGenerated ? 201 : 200;
    return res.status(statusCode).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * GET /notifications
 * Lista las notificaciones del usuario autenticado.
 * Query params opcionales: read (true/false/1/0), limit, offset
 */
function list(req, res) {
  const { read, limit, offset } = req.query;

  try {
    const notifications = notificationService.list(req.user.id, {
      read,
      limit,
      offset,
    });
    return res.status(200).json({ notifications });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * GET /notifications/:id
 * Obtiene el detalle de una notificación por ID verificando propiedad del usuario.
 */
function getById(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de notificación inválido.' });
  }

  try {
    const notification = notificationService.findById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    return res.status(200).json({ notification });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * PATCH /notifications/:id/read
 * Marca una notificación como leída.
 */
function markAsRead(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de notificación inválido.' });
  }

  try {
    const notification = notificationService.markAsRead(id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    return res.status(200).json({
      message: 'Notificación marcada como leída.',
      notification,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = {
  processTransactionEvent,
  list,
  getById,
  markAsRead,
};
