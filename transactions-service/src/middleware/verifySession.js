'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Módulo central de validación de sesión para transactions-service.
 *
 * REGLA (AGENTS.md): Toda validación de JWT debe pasar exclusivamente
 * por este middleware. No duplicar lógica de verificación en otros módulos.
 *
 * Extrae el token del header Authorization: Bearer <token>,
 * lo verifica con el mismo JWT_SECRET que auth-service emite
 * y adjunta el payload decodificado a req.user.
 *
 * En caso de token inválido o ausente, responde 401 sin detalle del error
 * interno (no se loguean tokens en texto plano).
 */
function verifySession(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido.' });
  }

  const token = authHeader.slice(7); // Extrae el token después de "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    // No se loguea el token ni el error detallado para evitar exponer información
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = verifySession;
