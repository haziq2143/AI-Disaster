import { randomBytes, scrypt, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mutateDocument, readDocument } from './database.js';

const scryptAsync = promisify(scrypt);
const STORE_KEY = 'accounts';
const EMPTY_STORE = { users: [], sessions: [], passwordResets: [] };
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PROFILE_FIELDS = [
  'profilePhoto',
  'dateOfBirth',
  'phone',
  'emergencyContactName',
  'emergencyContactPhone',
  'bloodType',
  'gender',
  'medicalInfo',
  'homeArea'
];
const EMPTY_PROFILE = Object.fromEntries(PROFILE_FIELDS.map(field => [field, '']));

function normalizeStore(store) {
  if (!Array.isArray(store.users) || !Array.isArray(store.sessions)) {
    throw new Error('Penyimpanan akun tidak valid.');
  }
  if (!Array.isArray(store.passwordResets)) store.passwordResets = [];
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

function publicProfile(user) {
  const profile = Object.fromEntries(PROFILE_FIELDS.map(field => [
    field,
    typeof user.profile?.[field] === 'string' ? user.profile[field] : ''
  ]));
  return { user: publicUser(user), profile };
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
    createdAt: new Date().toISOString()
  };

  return mutateStore(store => {
    if (store.users.some(account => account.email === normalizedEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }
    store.users.push(user);
    return publicUser(user);
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
  return publicUser(user);
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
    store.sessions = store.sessions.filter(session => session.userId !== user.id);
  });
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await mutateStore(store => {
    if (!store.users.some(account => account.id === userId)) throw new Error('Akun tidak ditemukan.');
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
  return user ? publicUser(user) : null;
}

export async function getAccountProfile(userId) {
  const store = await readStore();
  const user = store.users.find(account => account.id === userId);
  if (!user) throw new Error('Akun tidak ditemukan.');
  return publicProfile(user);
}

export async function updateAccountProfile(userId, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Format profil tidak valid.');
  }
  const allowedInputFields = new Set(['name', 'profile']);
  if (Object.keys(input).some(field => !allowedInputFields.has(field))) {
    throw new Error('Data profil tidak valid.');
  }
  if (input.profile !== undefined
    && (!input.profile || typeof input.profile !== 'object' || Array.isArray(input.profile))) {
    throw new Error('Format profil tidak valid.');
  }

  const suppliedProfile = input.profile || {};
  if (Object.keys(suppliedProfile).some(field => !PROFILE_FIELDS.includes(field))) {
    throw new Error('Data profil tidak valid.');
  }

  return mutateStore(store => {
    const user = store.users.find(account => account.id === userId);
    if (!user) throw new Error('Akun tidak ditemukan.');

    if (input.name !== undefined && typeof input.name !== 'string') {
      throw new Error('Nama harus terdiri dari 2–80 karakter.');
    }
    const name = input.name === undefined ? user.name : input.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new Error('Nama harus terdiri dari 2–80 karakter.');
    }

    const profile = { ...EMPTY_PROFILE, ...(user.profile || {}), ...suppliedProfile };
    for (const field of PROFILE_FIELDS) {
      if (typeof profile[field] !== 'string') throw new Error('Data profil tidak valid.');
      profile[field] = profile[field].trim();
    }
    if (profile.dateOfBirth) {
      const date = new Date(`${profile.dateOfBirth}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth)
        || Number.isNaN(date.getTime())
        || date.toISOString().slice(0, 10) !== profile.dateOfBirth
        || profile.dateOfBirth < '1900-01-01'
        || profile.dateOfBirth > new Date().toISOString().slice(0, 10)) {
        throw new Error('Tanggal lahir tidak valid.');
      }
    }
    for (const field of ['phone', 'emergencyContactPhone']) {
      if (profile[field] && (profile[field].length > 32 || !/^[+\d\s().-]{5,32}$/.test(profile[field]))) {
        throw new Error('Nomor telepon tidak valid.');
      }
    }
    if (profile.emergencyContactName.length > 80
      || profile.medicalInfo.length > 1000
      || profile.homeArea.length > 160) {
      throw new Error('Ada data profil yang melebihi batas panjang.');
    }
    if (!['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak tahu'].includes(profile.bloodType)) {
      throw new Error('Golongan darah tidak valid.');
    }
    if (!['', 'Perempuan', 'Laki-laki', 'Lainnya', 'Tidak ingin menyebutkan'].includes(profile.gender)) {
      throw new Error('Pilihan jenis kelamin tidak valid.');
    }
    if (profile.profilePhoto
      && (profile.profilePhoto.length > 350_000
        || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(profile.profilePhoto))) {
      throw new Error('Foto profil tidak valid atau ukurannya terlalu besar.');
    }

    user.name = name;
    user.profile = profile;
    return publicProfile(user);
  });
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
