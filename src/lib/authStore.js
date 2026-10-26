import { randomBytes, scrypt, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mutateDocument, readDocument } from './database.js';

const scryptAsync = promisify(scrypt);
const STORE_KEY = 'accounts';
const EMPTY_STORE = { users: [], sessions: [], passwordResets: [], emailVerifications: [] };
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeStore(store) {
  if (!Array.isArray(store.users) || !Array.isArray(store.sessions)) {
    throw new Error('Penyimpanan akun tidak valid.');
  }
  if (!Array.isArray(store.passwordResets)) store.passwordResets = [];
  if (!Array.isArray(store.emailVerifications)) store.emailVerifications = [];
  return store;
}

async function readStore() {
  return normalizeStore(await readDocument(STORE_KEY, EMPTY_STORE));
}

function mutateStore(mutator) {
  return mutateDocument(STORE_KEY, EMPTY_STORE, store => mutator(normalizeStore(store)));
}

function configuredAdminEmail() {
  return (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
}

function isInitialAdmin(email, bootstrapSecret) {
  if (!configuredAdminEmail() || email !== configuredAdminEmail()) return false;
  const expected = process.env.INITIAL_ADMIN_SECRET || '';
  if (expected.length < 32 || typeof bootstrapSecret !== 'string') return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(bootstrapSecret);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    canManageRoles: user.isInitialAdmin === true && user.email === configuredAdminEmail()
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export async function registerAccount(input) {
  const { name, email, password, bootstrapSecret } = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (normalizedName.length < 2 || normalizedName.length > 80) {
    throw new Error('Nama harus terdiri dari 2–80 karakter.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    throw new Error('Masukkan alamat email yang valid.');
  }
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
    throw new Error('Kata sandi harus terdiri dari 10–128 karakter.');
  }
  const initialAdmin = normalizedEmail === configuredAdminEmail();
  if (initialAdmin && !isInitialAdmin(normalizedEmail, bootstrapSecret)) {
    throw new Error('Kode bootstrap admin awal salah atau belum dikonfigurasi oleh server.');
  }

  const salt = randomBytes(16);
  const passwordHash = await scryptAsync(password, salt, 64);
  const user = {
    id: randomBytes(16).toString('hex'),
    name: normalizedName,
    email: normalizedEmail,
    role: initialAdmin ? 'sar' : 'user',
    isInitialAdmin: initialAdmin,
    passwordSalt: salt.toString('hex'),
    passwordHash: passwordHash.toString('hex'),
    emailVerifiedAt: null,
    createdAt: new Date().toISOString()
  };
  const verificationToken = randomBytes(32).toString('base64url');

  return mutateStore(store => {
    if (store.users.some(account => account.email === normalizedEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }
    store.users.push(user);
    const now = Date.now();
    store.emailVerifications = store.emailVerifications.filter(item => item.userId !== user.id);
    store.emailVerifications.push({
      tokenHash: createHash('sha256').update(verificationToken).digest('hex'),
      userId: user.id,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString()
    });
    return { user: publicUser(user), verificationToken };
  });
}

export async function authenticateAccount(input) {
  const { email, password } = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const normalizedEmail = normalizeEmail(email);
  if (typeof password !== 'string' || password.length > 128) {
    throw new Error('Email atau kata sandi tidak cocok.');
  }
  const store = await readStore();
  const user = store.users.find(account => account.email === normalizedEmail);
  const salt = user ? Buffer.from(user.passwordSalt, 'hex') : Buffer.alloc(16);
  const expected = user ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(64);
  const actual = await scryptAsync(password, salt, 64);
  if (!user || !timingSafeEqual(expected, actual)) {
    throw new Error('Email atau kata sandi tidak cocok.');
  }
  if (!user.emailVerifiedAt) throw new Error('Email belum diverifikasi. Periksa inbox atau minta tautan verifikasi baru.');
  return publicUser(user);
}

export async function createEmailVerificationToken(email) {
  const normalizedEmail = normalizeEmail(email);
  return mutateStore(store => {
    const user = store.users.find(account => account.email === normalizedEmail);
    const now = Date.now();
    store.emailVerifications = store.emailVerifications.filter(item => Date.parse(item.expiresAt) > now);
    if (!user || user.emailVerifiedAt) return null;

    const previous = store.emailVerifications.find(item => item.userId === user.id);
    if (previous && now - Date.parse(previous.createdAt) < 60_000) return null;

    const token = randomBytes(32).toString('base64url');
    store.emailVerifications = store.emailVerifications.filter(item => item.userId !== user.id);
    store.emailVerifications.push({
      tokenHash: createHash('sha256').update(token).digest('hex'),
      userId: user.id,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString()
    });
    return token;
  });
}

export async function verifyAccountEmail(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new Error('Tautan verifikasi tidak valid atau sudah kedaluwarsa.');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  return mutateStore(store => {
    const now = Date.now();
    const verification = store.emailVerifications.find(item => safeEqual(item.tokenHash, tokenHash));
    if (!verification || Date.parse(verification.expiresAt) <= now) {
      throw new Error('Tautan verifikasi tidak valid atau sudah kedaluwarsa.');
    }

    const user = store.users.find(account => account.id === verification.userId);
    if (!user) throw new Error('Akun untuk tautan verifikasi tidak ditemukan.');
    user.emailVerifiedAt = new Date(now).toISOString();
    store.emailVerifications = store.emailVerifications.filter(item => item.userId !== user.id);
    return publicUser(user);
  });
}

export async function createPasswordResetToken(email) {
  const normalizedEmail = normalizeEmail(email);
  return mutateStore(store => {
    const user = store.users.find(account => account.email === normalizedEmail);
    const now = Date.now();
    store.passwordResets = store.passwordResets.filter(reset => Date.parse(reset.expiresAt) > now);
    if (!user) return null;

    const previousReset = store.passwordResets.find(reset => reset.userId === user.id);
    if (previousReset && now - Date.parse(previousReset.createdAt) < 60_000) return null;

    const token = randomBytes(32).toString('base64url');
    store.passwordResets = store.passwordResets.filter(reset => reset.userId !== user.id);
    store.passwordResets.push({
      tokenHash: createHash('sha256').update(token).digest('hex'),
      userId: user.id,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 60 * 60 * 1000).toISOString()
    });
    return token;
  });
}

export async function resetAccountPassword(token, password) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new Error('Tautan reset tidak valid atau sudah kedaluwarsa.');
  }
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
    throw new Error('Kata sandi harus terdiri dari 10–128 karakter.');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const candidate = (await readStore()).passwordResets
    .find(item => safeEqual(item.tokenHash, tokenHash));
  if (!candidate || Date.parse(candidate.expiresAt) <= Date.now()) {
    throw new Error('Tautan reset tidak valid atau sudah kedaluwarsa.');
  }

  const salt = randomBytes(16);
  const passwordHash = await scryptAsync(password, salt, 64);
  return mutateStore(store => {
    const now = Date.now();
    const reset = store.passwordResets.find(item => safeEqual(item.tokenHash, tokenHash));
    if (!reset || Date.parse(reset.expiresAt) <= now) {
      throw new Error('Tautan reset tidak valid atau sudah kedaluwarsa.');
    }

    const user = store.users.find(account => account.id === reset.userId);
    if (!user) throw new Error('Akun untuk tautan reset tidak ditemukan.');

    user.passwordSalt = salt.toString('hex');
    user.passwordHash = passwordHash.toString('hex');
    store.passwordResets = store.passwordResets.filter(item => item.userId !== user.id);
    store.emailVerifications = store.emailVerifications.filter(item => item.userId !== user.id);
    store.sessions = store.sessions.filter(session => session.userId !== user.id);
  });
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await mutateStore(store => {
    const user = store.users.find(account => account.id === userId);
    if (!user?.emailVerifiedAt) throw new Error('Email belum diverifikasi.');
    store.sessions = store.sessions.filter(session => Date.parse(session.expiresAt) > Date.now());
    store.sessions.push({
      tokenHash: createHash('sha256').update(token).digest('hex'),
      userId,
      expiresAt
    });
  });
  return { token, maxAge: Math.floor(SESSION_DURATION_MS / 1000) };
}

export async function getUserForSession(token) {
  if (typeof token !== 'string' || token.length < 32) return null;
  const store = await readStore();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = store.sessions.find(item => safeEqual(item.tokenHash, tokenHash));
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  const user = store.users.find(account => account.id === session.userId);
  return user?.emailVerifiedAt ? publicUser(user) : null;
}

export async function revokeSession(token) {
  if (typeof token !== 'string') return;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await mutateStore(store => {
    store.sessions = store.sessions.filter(session => !safeEqual(session.tokenHash, tokenHash));
  });
}

export async function listAccounts() {
  const store = await readStore();
  return store.users.map(publicUser);
}

export async function setAccountRole(userId, role) {
  if (!['user', 'sar'].includes(role)) throw new Error('Role tidak valid.');
  return mutateStore(store => {
    const user = store.users.find(account => account.id === userId);
    if (!user) throw new Error('Akun tidak ditemukan.');
    if (user.isInitialAdmin === true && user.email === configuredAdminEmail() && role !== 'sar') {
      throw new Error('Role admin awal tidak dapat diturunkan.');
    }
    user.role = role;
    return publicUser(user);
  });
}

export const authCookieName = 'disaster_session';
export const getSessionDurationSeconds = () => Math.floor(SESSION_DURATION_MS / 1000);
