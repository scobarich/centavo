'use strict';

const { Router } = require('express');
const controller = require('../controllers/notification.controller');
const { verifySession, optionalVerifySession } = require('../middleware/verifySession');

const router = Router();

// Eventos de transacciones (evaluación de presupuesto y generación de alerta)
router.post('/events/transaction', optionalVerifySession, controller.processTransactionEvent);
router.post('/events/transaction-created', optionalVerifySession, controller.processTransactionEvent);

// Gestión y consulta de notificaciones para usuarios autenticados
router.get('/', verifySession, controller.list);
router.get('/:id', verifySession, controller.getById);
router.patch('/:id/read', verifySession, controller.markAsRead);

module.exports = router;
