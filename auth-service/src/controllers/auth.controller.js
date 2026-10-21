'use strict';

const authService = require('../services/auth.service');

/**
 * POST /auth/register
 * Body: { email, password }
 */
function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos.' });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'email inválido.' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  try {
    const user = authService.register(email.trim().toLowerCase(), password);
    return res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      user,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    // No incluir detalles del error interno en la respuesta de producción
    return res.status(status).json({ error: err.message });
  }
}

/**
 * POST /auth/login
 * Body: { email, password }
 */
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos.' });
  }

  try {
    const result = authService.login(email.trim().toLowerCase(), password);
    return res.status(200).json({
      message: 'Sesión iniciada.',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * GET /auth/me
 * Requiere verifySession middleware (adjunta req.user).
 */
function me(req, res) {
  const user = authService.findUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  return res.status(200).json({ user });
}

module.exports = { register, login, me };
