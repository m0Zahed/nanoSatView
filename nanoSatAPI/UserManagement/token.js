const crypto = require('crypto');

function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function expiresInHours(hours) {
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  generateRawToken,
  hashToken,
  expiresInHours,
  nowIso,
};
