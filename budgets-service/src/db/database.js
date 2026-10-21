'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/budgets.db';

const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(DB_PATH));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    month       TEXT    NOT NULL,
    amount      REAL    NOT NULL,
    category    TEXT    DEFAULT 'global',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, month, category)
  );
`);

module.exports = db;
