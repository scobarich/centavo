'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/notifications.db';

// Garantizar que el directorio de datos exista
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(DB_PATH));

// Activar modo WAL para mejor concurrencia
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Crea la tabla de notificaciones si no existe.
 * user_id referencia al usuario en auth-service (desacoplado sin FK cross-service).
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    type          TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    message       TEXT    NOT NULL,
    category      TEXT    DEFAULT 'global',
    amount        REAL    NOT NULL,
    budget_amount REAL    NOT NULL,
    total_spent   REAL    NOT NULL,
    month         TEXT    NOT NULL,
    read          INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
