require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { OAuth2Client } = require('google-auth-library');
const { db } = require('./db');
const { generateRawToken, hashToken, expiresInHours, nowIso } = require('./token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./email');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const APP_VERSION = process.env.APP_VERSION || 'unknown';
// Normalize URLs so we don't end up with double slashes in redirects/CORS
const rawOrigins = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const CLIENT_ORIGINS = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .map((o) => o.replace(/\/+$/, ''));
const CLIENT_ORIGIN = CLIENT_ORIGINS[0] || 'http://localhost:5173';
const VERIFY_PAGE_URL = (process.env.VERIFY_PAGE_URL || 'http://localhost:5173/verify-email').replace(/\/+$/, '');
const RESET_PAGE_URL = (process.env.RESET_PAGE_URL || 'http://localhost:5173/reset-password').replace(/\/+$/, '');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const ADMIN_EMAIL = 'zahedmohammedwork@gmail.com';

const allowedOrigins = new Set(
  CLIENT_ORIGINS.flatMap((o) => [o, `${o}/`])
);

app.use(
  cors({
    credentials: true,
  origin: (requestOrigin, callback) => {
    // Allow same-origin requests (e.g., curl, mobile) with no Origin header
    if (!requestOrigin) return callback(null, true);

    const normalized = requestOrigin.replace(/\/+$/, '');
    if (allowedOrigins.has(normalized)) {
      // mirror the exact origin back so the browser accepts it with credentials
      return callback(null, true);
    }
    console.warn('[cors] blocked origin', requestOrigin);
    return callback(new Error('Not allowed by CORS'));
  },
  })
);
app.use(express.json());
app.use(cookieParser());

const oauthClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI,
});

function createId() {
  return crypto.randomUUID();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

function isValidDateOfBirth(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findUserById(userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findUserByGoogleSub(googleSub) {
  return db.prepare('SELECT * FROM users WHERE googleSub = ?').get(googleSub);
}

function linkGoogleSub(userId, googleSub, pictureUrl) {
  db.prepare('UPDATE users SET googleSub = ?, pictureUrl = ? WHERE id = ?').run(
    googleSub,
    pictureUrl,
    userId
  );
}

function createUserWithGoogle({ email, fullName, emailVerified, googleSub, pictureUrl }) {
  const userId = createId();
  db.prepare(
    `INSERT INTO users (id, email, fullName, username, dateOfBirth, emailVerified, passwordHash, googleSub, pictureUrl)
     VALUES (?, ?, ?, NULL, NULL, ?, NULL, ?, ?)`
  ).run(userId, email, fullName, emailVerified ? 1 : 0, googleSub, pictureUrl);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

function createUserWithPassword({ email, fullName, username, dateOfBirth, passwordHash, pictureUrl }) {
  const userId = createId();
  db.prepare(
    `INSERT INTO users (id, email, fullName, username, dateOfBirth, emailVerified, passwordHash, googleSub, pictureUrl)
     VALUES (?, ?, ?, ?, ?, 0, ?, NULL, ?)`
  ).run(userId, email, fullName, username, dateOfBirth, passwordHash, pictureUrl ?? null);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

function markUserVerified(userId) {
  db.prepare('UPDATE users SET emailVerified = 1 WHERE id = ?').run(userId);
}

function markTokenUsed(tokenId) {
  db.prepare('UPDATE email_verification_tokens SET usedAt = ? WHERE id = ?').run(nowIso(), tokenId);
}

function removeUnusedTokensForUser(userId) {
  db.prepare('DELETE FROM email_verification_tokens WHERE userId = ? AND usedAt IS NULL').run(userId);
}

function insertVerificationToken({ userId, tokenHash, expiresAt }) {
  db.prepare(
    `INSERT INTO email_verification_tokens (id, userId, tokenHash, expiresAt, usedAt, createdAt)
     VALUES (?, ?, ?, ?, NULL, ?)`
  ).run(createId(), userId, tokenHash, expiresAt, nowIso());
}

function findValidToken(tokenHashValue) {
  return db.prepare(
    `SELECT * FROM email_verification_tokens
     WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > ?`
  ).get(tokenHashValue, nowIso());
}

function removeUnusedPasswordResetTokens(userId) {
  db.prepare('DELETE FROM password_reset_tokens WHERE userId = ? AND usedAt IS NULL').run(userId);
}

function insertPasswordResetToken({ userId, tokenHash, expiresAt }) {
  db.prepare(
    `INSERT INTO password_reset_tokens (id, userId, tokenHash, expiresAt, usedAt, createdAt)
     VALUES (?, ?, ?, ?, NULL, ?)`
  ).run(createId(), userId, tokenHash, expiresAt, nowIso());
}

function findValidPasswordResetToken(tokenHashValue) {
  return db.prepare(
    `SELECT * FROM password_reset_tokens
     WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > ?`
  ).get(tokenHashValue, nowIso());
}

function markPasswordResetTokenUsed(tokenId) {
  db.prepare('UPDATE password_reset_tokens SET usedAt = ? WHERE id = ?').run(nowIso(), tokenId);
}

function updateUserPassword(userId, passwordHash) {
  db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, userId);
}

function revokeUserSessions(userId) {
  db.prepare('UPDATE sessions SET revokedAt = ? WHERE userId = ? AND revokedAt IS NULL').run(nowIso(), userId);
}

function createSession(userId) {
  const sessionId = createId();
  db.prepare(
    `INSERT INTO sessions (id, userId, createdAt, revokedAt)
     VALUES (?, ?, ?, NULL)`
  ).run(sessionId, userId, nowIso());
  return sessionId;
}

function findActiveSession(sessionId) {
  return db.prepare(
    `SELECT * FROM sessions WHERE id = ? AND revokedAt IS NULL`
  ).get(sessionId);
}

function clearSession(sessionId) {
  db.prepare('UPDATE sessions SET revokedAt = ? WHERE id = ?').run(nowIso(), sessionId);
}

function toUserResponse(user) {
  const isAdmin = normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL);
  const profileComplete = Boolean(user.fullName && user.username && user.dateOfBirth);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    username: user.username ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    emailVerified: Boolean(user.emailVerified),
    pictureUrl: user.pictureUrl ?? null,
    isAdmin,
    profileComplete,
    hasPassword: Boolean(user.passwordHash),
    googleLinked: Boolean(user.googleSub),
  };
}

function isProfileComplete(user) {
  return Boolean(user.fullName && user.username && user.dateOfBirth);
}

function isPasswordStrong(password) {
  return password.length >= 8 && /\d/.test(password);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100_000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }
  const [prefix, iterationsValue, salt, hash] = passwordHash.split('$');
  if (prefix !== 'pbkdf2' || !iterationsValue || !salt || !hash) {
    return false;
  }
  const iterations = Number(iterationsValue);
  if (!Number.isFinite(iterations)) {
    return false;
  }
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

function getUserFromRequest(req) {
  const sid = req.cookies.sid;
  if (!sid) {
    return null;
  }
  const session = findActiveSession(sid);
  if (!session) {
    return null;
  }
  const user = findUserById(session.userId);
  return user ?? null;
}

app.post('/auth/signup', (req, res) => {
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const usernameRaw = typeof req.body?.username === 'string' ? req.body.username : '';
  const username = normalizeUsername(usernameRaw);
  const dateOfBirth = typeof req.body?.dateOfBirth === 'string' ? req.body.dateOfBirth : '';
  const pictureUrl = typeof req.body?.pictureUrl === 'string' ? req.body.pictureUrl : null;

  if (!email || !fullName || !username || !dateOfBirth || !password) {
    return res.status(400).json({
      error: {
        code: 'MISSING_FIELDS',
        message: 'Name, username, date of birth, email, and password are required.',
      },
    });
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_USERNAME',
        message: 'Username must be 3-20 characters and contain only letters, numbers, or underscores.',
      },
    });
  }

  if (!isValidDateOfBirth(dateOfBirth)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DATE_OF_BIRTH',
        message: 'Date of birth must be in YYYY-MM-DD format.',
      },
    });
  }

  if (!isPasswordStrong(password)) {
    return res.status(400).json({
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters and include a number.',
      },
    });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({
      error: {
        code: 'EMAIL_EXISTS',
        message: 'Email already exists.',
      },
    });
  }

  if (findUserByUsername(username)) {
    return res.status(409).json({
      error: {
        code: 'USERNAME_EXISTS',
        message: 'Username already exists.',
      },
    });
  }

  const passwordHash = hashPassword(password);
  const user = createUserWithPassword({
    email,
    fullName,
    username,
    dateOfBirth,
    passwordHash,
    pictureUrl,
  });

  if (!user) {
    return res.status(500).json({
      error: {
        code: 'SIGNUP_FAILED',
        message: 'Unable to create account.',
      },
    });
  }

  const rawToken = generateRawToken();
  const tokenHashValue = hashToken(rawToken);
  const expiresAt = expiresInHours(24);

  insertVerificationToken({ userId: user.id, tokenHash: tokenHashValue, expiresAt });

  const verifyUrl = `${VERIFY_PAGE_URL}?token=${encodeURIComponent(rawToken)}`;
  sendVerificationEmail({ email: user.email, verifyUrl });

  return res.status(201).json({ message: 'SIGNUP_OK' });
});

app.post('/auth/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required.',
      },
    });
  }

  const user = findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      },
    });
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      },
    });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before signing in.',
      },
    });
  }

  const sessionId = createSession(user.id);
  res.cookie('sid', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
  });

  return res.status(200).json({ user: toUserResponse(user) });
});

app.get('/auth/verify-email', (req, res) => {
  const rawToken = typeof req.query.token === 'string' ? req.query.token : '';
  if (!rawToken) {
    return res.status(400).json({
      error: {
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Verification link is invalid or expired.',
      },
    });
  }

  const tokenHashValue = hashToken(rawToken);
  const tokenRow = findValidToken(tokenHashValue);
  if (!tokenRow) {
    return res.status(400).json({
      error: {
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Verification link is invalid or expired.',
      },
    });
  }

  const transaction = db.transaction(() => {
    markTokenUsed(tokenRow.id);
    markUserVerified(tokenRow.userId);
  });

  transaction();

  return res.status(200).json({ message: 'EMAIL_VERIFIED' });
});

app.post('/auth/resend-verification', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email) {
    return res.status(200).json({ message: 'IF_ACCOUNT_EXISTS_EMAIL_SENT' });
  }

  const user = findUserByEmail(email);
  if (user && !user.emailVerified) {
    const rawToken = generateRawToken();
    const tokenHashValue = hashToken(rawToken);
    const expiresAt = expiresInHours(24);

    const transaction = db.transaction(() => {
      removeUnusedTokensForUser(user.id);
      insertVerificationToken({ userId: user.id, tokenHash: tokenHashValue, expiresAt });
    });
    transaction();

    const verifyUrl = `${VERIFY_PAGE_URL}?token=${encodeURIComponent(rawToken)}`;
    sendVerificationEmail({ email: user.email, verifyUrl });
  }

  return res.status(200).json({ message: 'IF_ACCOUNT_EXISTS_EMAIL_SENT' });
});

app.post('/auth/forgot-password', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email) {
    return res.status(200).json({ message: 'IF_ACCOUNT_EXISTS_EMAIL_SENT' });
  }

  const user = findUserByEmail(email);
  if (user && user.emailVerified) {
    const rawToken = generateRawToken();
    const tokenHashValue = hashToken(rawToken);
    const expiresAt = expiresInHours(0.5);

    const transaction = db.transaction(() => {
      removeUnusedPasswordResetTokens(user.id);
      insertPasswordResetToken({ userId: user.id, tokenHash: tokenHashValue, expiresAt });
    });
    transaction();

    const resetUrl = `${RESET_PAGE_URL}?token=${encodeURIComponent(rawToken)}`;
    sendPasswordResetEmail({ email: user.email, resetUrl });
  }

  return res.status(200).json({ message: 'IF_ACCOUNT_EXISTS_EMAIL_SENT' });
});

app.post('/auth/reset-password', (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!isPasswordStrong(newPassword)) {
    return res.status(400).json({
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters and include a number.',
      },
    });
  }

  const tokenHashValue = hashToken(token);
  const tokenRow = token ? findValidPasswordResetToken(tokenHashValue) : null;
  if (!tokenRow) {
    return res.status(400).json({
      error: {
        code: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Reset link is invalid or expired.',
      },
    });
  }

  const passwordHash = hashPassword(newPassword);
  const transaction = db.transaction(() => {
    markPasswordResetTokenUsed(tokenRow.id);
    updateUserPassword(tokenRow.userId, passwordHash);
    revokeUserSessions(tokenRow.userId);
  });
  transaction();

  return res.status(200).json({ message: 'PASSWORD_RESET_OK' });
});

app.get('/auth/me', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ user: null });
  }

  return res.status(200).json({ user: toUserResponse(user) });
});

app.post('/auth/profile', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ user: null });
  }

  const fullName =
    typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : user.fullName;
  const usernameRaw = typeof req.body?.username === 'string' ? req.body.username : user.username;
  const username = usernameRaw ? normalizeUsername(usernameRaw) : '';
  const dateOfBirth =
    typeof req.body?.dateOfBirth === 'string' ? req.body.dateOfBirth : user.dateOfBirth;
  const pictureUrl =
    typeof req.body?.pictureUrl === 'string' ? req.body.pictureUrl : user.pictureUrl;
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!fullName || !username || !dateOfBirth) {
    return res.status(400).json({
      error: {
        code: 'MISSING_FIELDS',
        message: 'Name, username, and date of birth are required.',
      },
    });
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_USERNAME',
        message: 'Username must be 3-20 characters and contain only letters, numbers, or underscores.',
      },
    });
  }

  if (!isValidDateOfBirth(dateOfBirth)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DATE_OF_BIRTH',
        message: 'Date of birth must be in YYYY-MM-DD format.',
      },
    });
  }

  if (username !== user.username) {
    const existing = findUserByUsername(username);
    if (existing && existing.id !== user.id) {
      return res.status(409).json({
        error: {
          code: 'USERNAME_EXISTS',
          message: 'Username already exists.',
        },
      });
    }
  }

  let passwordHash = null;
  if (password) {
    if (!isPasswordStrong(password)) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters and include a number.',
        },
      });
    }
    passwordHash = hashPassword(password);
  }

  if (passwordHash) {
    db.prepare(
      `UPDATE users
       SET fullName = ?, username = ?, dateOfBirth = ?, pictureUrl = ?, passwordHash = ?
       WHERE id = ?`
    ).run(fullName, username, dateOfBirth, pictureUrl ?? null, passwordHash, user.id);
  } else {
    db.prepare(
      `UPDATE users
       SET fullName = ?, username = ?, dateOfBirth = ?, pictureUrl = ?
       WHERE id = ?`
    ).run(fullName, username, dateOfBirth, pictureUrl ?? null, user.id);
  }

  const updatedUser = findUserById(user.id);
  return res.status(200).json({ user: toUserResponse(updatedUser) });
});

app.post('/auth/logout', (req, res) => {
  const sid = req.cookies.sid;
  if (sid) {
    clearSession(sid);
    res.clearCookie('sid');
  }
  return res.status(200).json({ message: 'LOGOUT_OK' });
});

app.get('/health', (_req, res) => {
  return res.status(200).json({ status: 'ok' });
});

app.get('/version', (_req, res) => {
  return res.status(200).json({ version: APP_VERSION });
});

app.get('/auth/google/start', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('[google oauth] missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
  }

  const state = generateRawToken();
  const nonce = generateRawToken();

  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000,
  });
  res.cookie('oauth_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000,
  });

  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    nonce,
    prompt: 'consent',
  });

  return res.redirect(302, authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const expectedState = req.cookies.oauth_state;
  const expectedNonce = req.cookies.oauth_nonce;

  res.clearCookie('oauth_state');
  res.clearCookie('oauth_nonce');

  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    console.error('[google oauth] missing code or state', { codePresent: Boolean(code), statePresent: Boolean(state) });
    return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
  }

  if (!expectedState || state !== expectedState) {
    console.error('[google oauth] state mismatch', { state, expectedState });
    return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
  }

  try {
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.id_token) {
      console.error('[google oauth] missing id_token in token response');
      return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      console.error('[google oauth] empty id_token payload');
      return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
    }

    if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
      console.error('[google oauth] nonce mismatch', { expectedNonce, receivedNonce: payload.nonce });
      return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
    }

    const googleSub = payload.sub;
    const email = payload.email ? normalizeEmail(payload.email) : null;
    const emailVerified = Boolean(payload.email_verified);
    const fullName = payload.name || email || 'Google User';
    const pictureUrl = payload.picture || null;

    if (!googleSub || !email) {
      console.error('[google oauth] missing required profile fields', { googleSubPresent: Boolean(googleSub), emailPresent: Boolean(email) });
      return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
    }

    let user = findUserByGoogleSub(googleSub);
    if (!user) {
      const existingByEmail = emailVerified ? findUserByEmail(email) : null;
      if (existingByEmail) {
        linkGoogleSub(existingByEmail.id, googleSub, pictureUrl);
        user = findUserByGoogleSub(googleSub);
      } else {
        user = createUserWithGoogle({
          email,
          fullName,
          emailVerified,
          googleSub,
          pictureUrl,
        });
      }
    }

    if (!user) {
      console.error('[google oauth] user linking failed');
      return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
    }

    const sessionId = createSession(user.id);
    res.cookie('sid', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
    });

    const nextPath = isProfileComplete(user) ? '/dashboard' : '/complete-profile';
    return res.redirect(302, `${CLIENT_ORIGIN}${nextPath}`);
  } catch (error) {
    console.error('[google oauth] failure', error);
    return res.redirect(302, `${CLIENT_ORIGIN}/login?oauth=failed`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`UserManagement listening on http://0.0.0.0:${PORT}`);
});
