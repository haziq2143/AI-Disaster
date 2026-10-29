import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';

const enabled = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true';

test('PostgreSQL account sessions and one-use family invites', { skip: !enabled }, async () => {
  const {
    registerAccount,
    authenticateAccount,
    createSession,
    getUserForSession,
    revokeSession,
    setAccountRole,
    getAccountProfile,
    updateAccountProfile,
    listAccounts
  } =
    await import('../src/lib/authStore.js');
  const { createFamilyGroup, createFamilyInvite, joinFamilyGroup } =
    await import('../src/lib/familyGroupStore.js');
  const { consumeRateLimit, mutateDocument } = await import('../src/lib/database.js');
  const email = `integration-${randomUUID()}@example.test`;
  let userId;
  let groupId;

  try {
    const registration = await registerAccount({ name: 'Integration User', email, password: 'integration-password-123' });
    const user = registration;
    userId = user.id;
    assert.equal((await authenticateAccount({ email, password: 'integration-password-123' })).id, user.id);
    const updatedProfile = await updateAccountProfile(user.id, {
      name: 'Updated Integration User',
      profile: {
        dateOfBirth: '1995-06-15',
        phone: '+62 812 3456 7890',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '+62 811 2222 3333',
        bloodType: 'O+',
        gender: 'Tidak ingin menyebutkan',
        medicalInfo: 'Test medical notes',
        homeArea: 'Test District'
      }
    });
    assert.equal(updatedProfile.user.name, 'Updated Integration User');
    assert.equal((await getAccountProfile(user.id)).profile.bloodType, 'O+');
    assert.equal(Object.hasOwn((await listAccounts())[0], 'profile'), false);
    await assert.rejects(
      updateAccountProfile(user.id, { profile: { dateOfBirth: 'not-a-date' } }),
      /Tanggal lahir tidak valid/
    );

    const session = await createSession(user.id);
    assert.equal((await getUserForSession(session.token)).id, user.id);
    await revokeSession(session.token);
    assert.equal(await getUserForSession(session.token), null);
    assert.equal((await setAccountRole(user.id, 'sar')).role, 'sar');

    const rateKey = `sos:integration-${randomUUID()}`;
    assert.equal((await consumeRateLimit(rateKey, 3, 900)).allowed, true);
    await consumeRateLimit(rateKey, 3, 900);
    await consumeRateLimit(rateKey, 3, 900);
    assert.equal((await consumeRateLimit(rateKey, 3, 900)).allowed, false);

    const group = await createFamilyGroup({
      familyMembers: [{ name: 'Integration User' }],
      familyPlan: { meetingPoint: 'Test point' }
    });
    groupId = group.id;
    const invite = await createFamilyInvite({ groupId, accessToken: group.accessToken });
    const joined = await joinFamilyGroup({ inviteToken: invite.token, member: { name: 'Second Member' } });
    assert.equal(joined.members.length, 2);
    await assert.rejects(
      joinFamilyGroup({ inviteToken: invite.token, member: { name: 'Third Member' } }),
      /Token undangan/
    );
  } finally {
    if (userId) {
      await mutateDocument('accounts', { users: [], sessions: [], passwordResets: [] }, store => {
        store.users = store.users.filter(user => user.id !== userId);
        store.sessions = store.sessions.filter(session => session.userId !== userId);
        store.passwordResets = store.passwordResets.filter(reset => reset.userId !== userId);
      });
    }
    if (groupId) {
      await mutateDocument('family_groups', { groups: [] }, store => {
        store.groups = store.groups.filter(group => group.id !== groupId);
      });
    }
  }
});

after(async () => {
  if (!enabled) return;
  const { closeDatabasePool } = await import('../src/lib/database.js');
  await closeDatabasePool();
});
