'use strict';

const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const verifySession = require('../middleware/verifySession');

const router = Router();

// Rutas públicas
router.post('/register', controller.register);
router.post('/login', controller.login);

// Ruta protegida — pasa por el módulo central de validación de sesión
router.get('/me', verifySession, controller.me);

module.exports = router;
