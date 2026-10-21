'use strict';

const { Router } = require('express');
const controller = require('../controllers/transaction.controller');
const verifySession = require('../middleware/verifySession');

const router = Router();

// Todas las rutas de transacciones requieren sesión activa
router.post('/', verifySession, controller.create);
router.get('/', verifySession, controller.list);
router.get('/:id', verifySession, controller.getById);

module.exports = router;
