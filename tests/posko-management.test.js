import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyPoskoUpdate,
  isRouteEligiblePosko,
  normalizePosko,
  validatePoskoUpdate
} from '../src/lib/poskoManagement.js';

const posko = {
  id: 'posko-test',
  name: 'Posko Warga',
  address: 'Balai warga',
  lat: -6.2,
  lng: 106.8,
  contact: '021123456',
  source_type: 'sar_contribution',
  operational_status: 'open',
  verification_status: 'pending'
};

test('only open posko checked by SAR are eligible as route destinations', () => {
  assert.equal(isRouteEligiblePosko(normalizePosko(posko)), false);
  assert.equal(isRouteEligiblePosko({ ...posko, verification_status: 'sar_checked' }), true);
  assert.equal(isRouteEligiblePosko({ ...posko, operational_status: 'closed', verification_status: 'sar_checked' }), false);
  assert.equal(isRouteEligiblePosko({ ...posko, operational_status: 'unknown', verification_status: 'sar_checked' }), false);
  assert.equal(normalizePosko({ id: 'legacy-posko' }).operational_status, 'unknown');
  assert.equal(isRouteEligiblePosko({ ...posko, status: 'verified' }), false);
});

test('checking a posko records the SAR user and timestamp', () => {
  const checkedAt = new Date('2026-11-13T16:00:00.000Z');
  const checked = applyPoskoUpdate(
    posko,
    { verification_status: 'sar_checked' },
    'Petugas SAR',
    checkedAt
  );

  assert.equal(checked.verification_status, 'sar_checked');
  assert.equal(checked.last_checked_by, 'Petugas SAR');
  assert.equal(checked.last_checked_at, checkedAt.toISOString());
  assert.equal(isRouteEligiblePosko(checked), true);
});

test('editing details or reopening a closed posko requires a new check', () => {
  const checked = applyPoskoUpdate(
    posko,
    { verification_status: 'sar_checked' },
    'Petugas SAR',
    new Date('2026-11-13T16:00:00.000Z')
  );
  const edited = applyPoskoUpdate(
    checked,
    { address: 'Alamat baru' },
    'Petugas SAR',
    new Date('2026-11-13T16:01:00.000Z')
  );
  assert.equal(edited.verification_status, 'pending');
  assert.equal(edited.last_checked_at, null);
  assert.equal(isRouteEligiblePosko(edited), false);

  const closed = applyPoskoUpdate(
    checked,
    { operational_status: 'closed' },
    'Petugas SAR',
    new Date('2026-11-13T16:02:00.000Z')
  );
  const reopened = applyPoskoUpdate(
    closed,
    { operational_status: 'open' },
    'Petugas SAR',
    new Date('2026-11-13T16:03:00.000Z')
  );
  assert.equal(reopened.verification_status, 'pending');
  assert.equal(reopened.last_checked_by, null);

  const openedFromUnknown = applyPoskoUpdate(
    { ...checked, operational_status: 'unknown' },
    { operational_status: 'open' },
    'Petugas SAR',
    new Date('2026-11-13T16:04:00.000Z')
  );
  assert.equal(openedFromUnknown.verification_status, 'pending');
});

test('posko updates reject invalid coordinates and unsupported properties', () => {
  assert.match(validatePoskoUpdate({ lat: 91 }).error, /Latitude/);
  assert.match(validatePoskoUpdate({ is_admin: true }).error, /tidak valid/);
  assert.deepEqual(validatePoskoUpdate({ contact: '  ' }).updates, {
    contact: 'Belum diinformasikan'
  });
});
