import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEmergencyReport } from '../src/lib/emergencyReportValidation.js';

const validReport = {
  lat: -6.888,
  lng: 107.594,
  hazard_type: 'banjir',
  urgency_level: 'KRITIS',
  needs_description: 'Mohon bantuan evakuasi.',
  vulnerable_members: '1 lansia',
  precision_consent: true
};

test('accepts a valid SOS report and normalizes optional text', () => {
  const result = validateEmergencyReport({ ...validReport, needs_description: '  Perlu evakuasi  ' });
  assert.equal(result.needs_description, 'Perlu evakuasi');
  assert.equal(result.precision_consent, true);
});

test('accepts geographic boundary coordinates', () => {
  assert.doesNotThrow(() => validateEmergencyReport({ ...validReport, lat: -90, lng: 180 }));
});

test('rejects coordinates outside geographic bounds', () => {
  assert.throws(() => validateEmergencyReport({ ...validReport, lat: 90.01 }), { status: 400 });
  assert.throws(() => validateEmergencyReport({ ...validReport, lng: -180.01 }), { status: 400 });
});

test('rejects non-numeric coordinates', () => {
  assert.throws(() => validateEmergencyReport({ ...validReport, lat: '-6.888' }), { status: 400 });
  assert.throws(() => validateEmergencyReport({ ...validReport, lng: Number.NaN }), { status: 400 });
});

test('requires explicit consent and an allowed hazard type', () => {
  assert.throws(() => validateEmergencyReport({ ...validReport, precision_consent: false }), { status: 400 });
  assert.throws(() => validateEmergencyReport({ ...validReport, hazard_type: 'made-up' }), { status: 400 });
});

test('rejects invalid urgency and oversized descriptions', () => {
  assert.throws(() => validateEmergencyReport({ ...validReport, urgency_level: 'EMERGENCY' }), { status: 400 });
  assert.throws(() => validateEmergencyReport({ ...validReport, needs_description: 'x'.repeat(1001) }), { status: 400 });
  assert.throws(() => validateEmergencyReport({ ...validReport, vulnerable_members: 'x'.repeat(501) }), { status: 400 });
});

test('rejects arrays and null as request bodies', () => {
  assert.throws(() => validateEmergencyReport([]), { status: 400 });
  assert.throws(() => validateEmergencyReport(null), { status: 400 });
});
