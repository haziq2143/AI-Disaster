import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateLocationIntegrity } from '../src/lib/locationIntegrity.js';

test('evaluates clean realistic location as Tingkat 1 (clean)', () => {
  const reading = {
    lat: -5.9860,
    lng: 106.0520,
    accuracy: 15,
    timestamp: Date.now()
  };

  const result = evaluateLocationIntegrity(reading);
  assert.equal(result.status, 'clean');
  assert.equal(result.publicLabel, 'Lokasi belum diverifikasi secara menyeluruh');
  assert.equal(result.riskScore, 0);
  assert.equal(result.indicators.length, 0);
});

test('flags artificial accuracy of 0 meters as Tingkat 2 (caution/fake GPS indicator)', () => {
  const mockReading = {
    lat: -5.9860,
    lng: 106.0520,
    accuracy: 0, // Artificial 0-meter accuracy commonly set by mock GPS apps
    timestamp: Date.now()
  };

  const result = evaluateLocationIntegrity(mockReading);
  assert.equal(result.status, 'caution');
  assert.equal(result.publicLabel, 'Perlu verifikasi tambahan');
  assert.ok(result.riskScore >= 45);
  assert.ok(result.indicators.some(i => i.includes('0 meter')));
});

test('flags teleportation / supersonic jump as Tingkat 3 (flagged)', () => {
  const previous = {
    lat: -5.9860,
    lng: 106.0520,
    timestamp: Date.now() - 5000 // 5 seconds ago
  };

  // Jump to Serang (18.5 km away) in 5 seconds = ~13,000 km/h
  const teleportReading = {
    lat: -6.1202,
    lng: 106.1503,
    accuracy: 12,
    timestamp: Date.now()
  };

  const result = evaluateLocationIntegrity(teleportReading, previous);
  assert.equal(result.status, 'flagged');
  assert.equal(result.publicLabel, 'Sedang ditinjau');
  assert.ok(result.riskScore >= 60);
  assert.ok(result.indicators.some(i => i.includes('Perpindahan tidak wajar')));
});

test('flags explicit mock flag when platform/OS mock signal is active', () => {
  const reading = {
    lat: -5.9860,
    lng: 106.0520,
    accuracy: 20,
    isMock: true,
    timestamp: Date.now()
  };

  const result = evaluateLocationIntegrity(reading);
  assert.equal(result.status, 'flagged');
  assert.equal(result.publicLabel, 'Sedang ditinjau');
  assert.ok(result.indicators.some(i => i.includes('mock provider')));
});
