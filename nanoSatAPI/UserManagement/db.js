const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'user-management.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    fullName TEXT NOT NULL,
    username TEXT UNIQUE,
    dateOfBirth TEXT,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    passwordHash TEXT,
    googleSub TEXT,
    pictureUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    tokenHash TEXT UNIQUE NOT NULL,
    expiresAt TEXT NOT NULL,
    usedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    tokenHash TEXT UNIQUE NOT NULL,
    expiresAt TEXT NOT NULL,
    usedAt TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    revokedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

const columns = db.prepare('PRAGMA table_info(users)').all().map((row) => row.name);
if (!columns.includes('passwordHash')) {
  db.exec('ALTER TABLE users ADD COLUMN passwordHash TEXT');
}
if (!columns.includes('googleSub')) {
  db.exec('ALTER TABLE users ADD COLUMN googleSub TEXT');
}
if (!columns.includes('pictureUrl')) {
  db.exec('ALTER TABLE users ADD COLUMN pictureUrl TEXT');
}
if (!columns.includes('username')) {
  db.exec('ALTER TABLE users ADD COLUMN username TEXT');
}
if (!columns.includes('dateOfBirth')) {
  db.exec('ALTER TABLE users ADD COLUMN dateOfBirth TEXT');
}

db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username)');

module.exports = {
  db,
};
