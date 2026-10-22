import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const storePath = process.env.FAMILY_GROUPS_FILE || path.join(process.cwd(), 'data', 'family_groups.json');
const inviteLifetimeMs = 24 * 60 * 60 * 1000;
let writeQueue = Promise.resolve();

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function matchesHash(token, expectedHash) {
  const actual = Buffer.from(hashToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createAccessToken() {
  return randomBytes(32).toString('base64url');
}

function normalizeMembers(members) {
  if (!Array.isArray(members) || members.length > 100) {
    throw createError('Data anggota keluarga tidak valid.', 400);
  }

  return members.map(member => {
    const name = typeof member?.name === 'string' ? member.name.trim().slice(0, 80) : '';
    if (!name) throw createError('Nama anggota wajib diisi.', 400);

    return {
      id: typeof member.id === 'string' ? member.id.slice(0, 80) : randomUUID(),
      name,
      relationship: typeof member.relationship === 'string' ? member.relationship.trim().slice(0, 80) : 'Anggota Keluarga',
      supportNeeds: typeof member.supportNeeds === 'string' ? member.supportNeeds.trim().slice(0, 500) : '',
      status: member.status === 'together' ? 'together' : 'unconfirmed',
      checkInStatus: ['safe', 'help', 'unconfirmed'].includes(member.checkInStatus)
        ? member.checkInStatus
        : member.status === 'together' ? 'safe' : 'unconfirmed',
      ...(typeof member.checkedInAt === 'string' ? { checkedInAt: member.checkedInAt.slice(0, 40) } : {})
    };
  });
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    throw createError('Rencana keluarga tidak valid.', 400);
  }

  const text = key => typeof plan[key] === 'string' ? plan[key].trim().slice(0, 500) : '';
  const backupContacts = Array.isArray(plan.backupContacts)
    ? plan.backupContacts.slice(0, 5).map(contact => typeof contact === 'string' ? contact.trim().slice(0, 120) : '')
    : ['', ''];

  return {
    meetingPoint: text('meetingPoint'),
    meetingArea: text('meetingArea'),
    backupContacts,
    localEmergencyName: text('localEmergencyName'),
    localEmergencyNumber: text('localEmergencyNumber'),
    localEmergencySource: text('localEmergencySource'),
    localEmergencyCheckedAt: text('localEmergencyCheckedAt')
  };
}

async function readStore() {
  try {
    const content = await readFile(storePath, 'utf8');
    const data = JSON.parse(content);
    if (!Array.isArray(data.groups)) throw new Error('Invalid family group store format.');
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return { groups: [] };
    throw error;
  }
}

async function writeStore(data) {
  await mkdir(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(data), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, storePath);
}

function mutateStore(mutator) {
  const operation = writeQueue.then(async () => {
    const data = await readStore();
    const result = await mutator(data);
    await writeStore(data);
    return result;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function findAuthorizedGroup(data, groupId, token) {
  const group = data.groups.find(item => item.id === groupId);
  if (!group) throw createError('Grup keluarga tidak ditemukan.', 404);
  if (typeof token !== 'string' || !group.accessTokenHashes.some(hash => matchesHash(token, hash))) {
    throw createError('Akses grup tidak valid. Gabung kembali dengan token undangan.', 401);
  }
  return group;
}

export async function createFamilyGroup({ familyMembers, familyPlan }) {
  const accessToken = createAccessToken();
  const group = {
    id: randomUUID(),
    members: normalizeMembers(familyMembers),
    familyPlan: normalizePlan(familyPlan),
    accessTokenHashes: [hashToken(accessToken)],
    invites: [],
    updatedAt: new Date().toISOString()
  };

  await mutateStore(data => data.groups.push(group));
  return { id: group.id, accessToken, members: group.members, familyPlan: group.familyPlan, updatedAt: group.updatedAt };
}

export async function createFamilyInvite({ groupId, accessToken }) {
  const token = randomBytes(12).toString('hex');
  const expiresAt = new Date(Date.now() + inviteLifetimeMs).toISOString();

  await mutateStore(data => {
    const group = findAuthorizedGroup(data, groupId, accessToken);
    group.invites = group.invites.filter(invite => Date.parse(invite.expiresAt) > Date.now());
    group.invites.push({ tokenHash: hashToken(token), expiresAt });
    group.updatedAt = new Date().toISOString();
  });

  return { token, expiresAt };
}

export async function joinFamilyGroup({ inviteToken, member }) {
  if (typeof inviteToken !== 'string' || inviteToken.length > 100) {
    throw createError('Token undangan tidak valid atau sudah kedaluwarsa.', 400);
  }

  const accessToken = createAccessToken();
  const normalizedMember = normalizeMembers([{
    ...member,
    id: randomUUID(),
    status: 'unconfirmed',
    checkInStatus: 'unconfirmed'
  }])[0];

  const result = await mutateStore(data => {
    const group = data.groups.find(item => item.invites.some(invite =>
      Date.parse(invite.expiresAt) > Date.now() && matchesHash(inviteToken, invite.tokenHash)
    ));
    if (!group) throw createError('Token undangan tidak valid, sudah dipakai, atau kedaluwarsa.', 404);
    if (group.members.length >= 100) throw createError('Grup keluarga sudah mencapai batas 100 anggota.', 409);

    group.invites = group.invites.filter(invite => !matchesHash(inviteToken, invite.tokenHash));
    group.members.push(normalizedMember);
    group.accessTokenHashes.push(hashToken(accessToken));
    group.updatedAt = new Date().toISOString();

    return {
      id: group.id,
      members: group.members,
      familyPlan: group.familyPlan,
      updatedAt: group.updatedAt
    };
  });

  return { ...result, accessToken };
}

export async function getFamilyGroup({ groupId, accessToken }) {
  const data = await readStore();
  const group = findAuthorizedGroup(data, groupId, accessToken);
  return {
    id: group.id,
    members: group.members,
    familyPlan: group.familyPlan,
    updatedAt: group.updatedAt
  };
}

export async function updateFamilyGroup({ groupId, accessToken, familyMembers, familyPlan }) {
  return mutateStore(data => {
    const group = findAuthorizedGroup(data, groupId, accessToken);
    group.members = normalizeMembers(familyMembers);
    group.familyPlan = normalizePlan(familyPlan);
    group.updatedAt = new Date().toISOString();
    return {
      id: group.id,
      members: group.members,
      familyPlan: group.familyPlan,
      updatedAt: group.updatedAt
    };
  });
}

export function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function readFamilyRequestBody(request) {
  try {
    return await request.json();
  } catch {
    throw createError('Isi permintaan tidak valid.', 400);
  }
}

export function familyErrorResponse(error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  if (status >= 500) console.error('Family group API failed:', error);
  return Response.json(
    { success: false, error: status >= 500 ? 'Layanan keluarga sedang bermasalah. Coba lagi nanti.' : error.message },
    { status }
  );
}
