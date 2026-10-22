import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scrypt, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const STORE_FILE = process.env.AUTH_STORE_FILE
  ? path.resolve(process.env.AUTH_STORE_FILE)
  : path.join(process.cwd(), 'data', 'accounts.json');
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
let writeQueue = Promise.resolve();

function withWriteLock(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

function emptyStore() {
  return { users: [], sessions: [] };
}

function readStore() {
  const directory = path.dirname(STORE_FILE);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(emptyStore(), null, 2), 'utf8');
  }
  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  if (!Array.isArray(store.users) || !Array.isArray(store.sessions)) {
    throw new Error('Penyimpanan akun tidak valid.');
  }
  return store;
}

function writeStore(store) {
  const temporaryFile = `${STORE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporaryFile, STORE_FILE);
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

  return withWriteLock(async () => {
    const store = readStore();
    if (store.users.some(user => user.email === normalizedEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
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
      createdAt: new Date().toISOString()
    };
    store.users.push(user);
    writeStore(store);
    return publicUser(user);
  });
}

export async function authenticateAccount(input) {
  const { email, password } = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const normalizedEmail = normalizeEmail(email);
  if (typeof password !== 'string' || password.length > 128) {
    throw new Error('Email atau kata sandi tidak cocok.');
  }
  const store = readStore();
  const user = store.users.find(account => account.email === normalizedEmail);
  const salt = user ? Buffer.from(user.passwordSalt, 'hex') : Buffer.alloc(16);
  const expected = user ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(64);
  const actual = await scryptAsync(typeof password === 'string' ? password : '', salt, 64);
  if (!user || !timingSafeEqual(expected, actual)) {
    throw new Error('Email atau kata sandi tidak cocok.');
  }
  return publicUser(user);
}

export function createSession(userId) {
  return withWriteLock(() => {
    const store = readStore();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
    store.sessions = store.sessions.filter(session => Date.parse(session.expiresAt) > Date.now());
    store.sessions.push({
      tokenHash: createHash('sha256').update(token).digest('hex'),
      userId,
      expiresAt
    });
    writeStore(store);
    return { token, maxAge: Math.floor(SESSION_DURATION_MS / 1000) };
  });
}

export function getUserForSession(token) {
  if (typeof token !== 'string' || token.length < 32) return null;
  const store = readStore();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = store.sessions.find(item => safeEqual(item.tokenHash, tokenHash));
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  const user = store.users.find(account => account.id === session.userId);
  return user ? publicUser(user) : null;
}

export function revokeSession(token) {
  if (typeof token !== 'string') return Promise.resolve();
  return withWriteLock(() => {
    const store = readStore();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    store.sessions = store.sessions.filter(session => !safeEqual(session.tokenHash, tokenHash));
    writeStore(store);
  });
}

export function listAccounts() {
  const store = readStore();
  return store.users.map(publicUser);
}

export function setAccountRole(userId, role) {
  if (!['user', 'sar'].includes(role)) throw new Error('Role tidak valid.');
  return withWriteLock(() => {
    const store = readStore();
    const user = store.users.find(account => account.id === userId);
    if (!user) throw new Error('Akun tidak ditemukan.');
    if (user.isInitialAdmin === true && user.email === configuredAdminEmail() && role !== 'sar') {
      throw new Error('Role admin awal tidak dapat diturunkan.');
    }
    user.role = role;
    writeStore(store);
    return publicUser(user);
  });
}

export const authCookieName = 'disaster_session';
export const getSessionDurationSeconds = () => Math.floor(SESSION_DURATION_MS / 1000);
