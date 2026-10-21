'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Módulo central de validación de sesión para notifications-service.
 *
 * REGLA (AGENTS.md): Toda validación de JWT debe pasar exclusivamente
 * por este middleware. No duplicar lógica de verificación en otros módulos.
 *
 * Extrae el token del header Authorization: Bearer <token>,
 * lo verifica con JWT_SECRET compartido y adjunta el payload decodificado a req.user.
 */
function verifySession(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido.' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware opcional para endpoints de eventos entre microservicios.
 * Si viene Authorization: Bearer <token>, lo decodifica y adjunta a req.user.
 * Si no viene, permite continuar para que el endpoint pueda validar req.body.userId.
 */
function optionalVerifySession(req, _res, next) {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.sub, email: decoded.email };
    } catch {
      // Si el token es inválido en una llamada con Bearer, se ignora req.user
    }
  }

  next();
}

module.exports = verifySession;
module.exports.verifySession = verifySession;
module.exports.optionalVerifySession = optionalVerifySession;
