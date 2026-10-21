'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const BCRYPT_ROUNDS = 12; // Cost factor: justificado en README.md y AGENTS.md
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('[auth.service] JWT_SECRET no está definido. Revisa tu archivo .env');
}

/**
 * Registra un nuevo usuario.
 * @param {string} email
 * @param {string} password - contraseña en texto plano (solo existe en este scope, no se loguea)
 * @returns {{ id: number, email: string }}
 * @throws {Error} si el email ya existe
 */
function register(email, password) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    const err = new Error('El email ya está registrado.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

  const stmt = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  );
  const result = stmt.run(email, passwordHash);

  return { id: result.lastInsertRowid, email };
}

/**
 * Autentica un usuario y devuelve un JWT firmado.
 * @param {string} email
 * @param {string} password - contraseña en texto plano
 * @returns {{ token: string, user: { id: number, email: string } }}
 * @throws {Error} si las credenciales son inválidas
 */
function login(email, password) {
  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);

  // Respuesta genérica para no revelar si el email existe o no
  const invalidErr = new Error('Credenciales inválidas.');
  invalidErr.statusCode = 401;

  if (!user) {
    // Ejecutar bcrypt de todas formas para evitar timing attacks
    bcrypt.hashSync(password, BCRYPT_ROUNDS);
    throw invalidErr;
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    throw invalidErr;
  }

  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // NUNCA incluir password_hash en el objeto retornado
  return {
    token,
    user: { id: user.id, email: user.email },
  };
}

/**
 * Busca un usuario por ID (para el endpoint /me).
 * @param {number} id
 * @returns {{ id: number, email: string, created_at: string } | undefined}
 */
function findUserById(id) {
  return db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id);
}

module.exports = { register, login, findUserById };
