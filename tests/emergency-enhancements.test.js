import test from 'node:test';
import assert from 'node:assert/strict';
import {
  queueSosReport,
  getSosOutbox,
  removeSosFromOutbox,
  saveSosOutbox
} from '../src/lib/emergencyOutbox.js';
import {
  validatePoskoUpdate,
  applyPoskoUpdate,
  normalizePosko,
  isRouteEligiblePosko
} from '../src/lib/poskoManagement.js';
import { updateReportStatus } from '../src/lib/disasterDb.js';

// Mock localStorage for node test runner
const memoryStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem: key => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
    setItem: (key, val) => memoryStorage.set(key, String(val)),
    removeItem: key => memoryStorage.delete(key),
    clear: () => memoryStorage.clear()
  }
};

test('emergency outbox queues, reads, and removes pending SOS reports', () => {
  memoryStorage.clear();
  assert.equal(getSosOutbox().length, 0);

  const samplePayload = {
    lat: -6.89,
    lng: 107.59,
    reporter_name: 'Warga Terjebak',
    hazard_type: 'gempa',
    urgency_level: 'KRITIS',
    needs_description: 'Tertimpa reruntuhan tembok rumah.'
  };

  const queued = queueSosReport(samplePayload);
  assert.ok(queued.id);
  assert.deepEqual(queued.payload, samplePayload);

  const outbox = getSosOutbox();
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].id, queued.id);

  removeSosFromOutbox(queued.id);
  assert.equal(getSosOutbox().length, 0);
});

test('posko management allows updating current_occupancy and max_capacity', () => {
  const validUpdate = validatePoskoUpdate({
    current_occupancy: 45,
    max_capacity: 120
  });
  assert.equal(validUpdate.error, null);
  assert.equal(validUpdate.updates.current_occupancy, 45);
  assert.equal(validUpdate.updates.max_capacity, 120);

  const invalidNegative = validatePoskoUpdate({
    current_occupancy: -5
  });
  assert.match(invalidNegative.error, /Jumlah pengungsi/);

  const invalidZeroMax = validatePoskoUpdate({
    max_capacity: 0
  });
  assert.match(invalidZeroMax.error, /Kapasitas maksimal/);
});

test('updating occupancy does not invalidate verified SAR status', () => {
  const verifiedPosko = {
    id: 'posko-1',
    name: 'Posko Siaga',
    address: 'Jl. Merdeka',
    lat: -6.88,
    lng: 107.59,
    operational_status: 'open',
    verification_status: 'sar_checked',
    last_checked_at: new Date().toISOString(),
    last_checked_by: 'Budi SAR',
    current_occupancy: 20,
    max_capacity: 100
  };

  assert.equal(isRouteEligiblePosko(verifiedPosko), true);

  const updatedOccupancy = applyPoskoUpdate(verifiedPosko, { current_occupancy: 25 }, 'Budi SAR');
  assert.equal(updatedOccupancy.current_occupancy, 25);
  // Pengecekan tidak boleh hangus hanya karena jumlah pengungsi berubah
  assert.equal(updatedOccupancy.verification_status, 'sar_checked');
  assert.equal(isRouteEligiblePosko(updatedOccupancy), true);
});

test('updateReportStatus sets in_progress status with dispatch team and ETA', async () => {
  const updated = await updateReportStatus('rep-sos-1', 'in_progress', {
    dispatch_team: 'Regu Alpha 01 - Basarnas',
    eta_minutes: 12
  });

  assert.ok(updated);
  assert.equal(updated.status, 'in_progress');
  assert.equal(updated.dispatch_team, 'Regu Alpha 01 - Basarnas');
  assert.equal(updated.eta_minutes, 12);
  assert.ok(updated.dispatched_at);
});
