import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDistance, calculateRoadDistance, formatDistance, formatTravelTime } from '../src/lib/geoUtils.js';

test('calculateDistance returns accurate straight-line Haversine meters', () => {
  // Cilegon to Serang center
  const dist = calculateDistance(-5.9860, 106.0520, -6.1202, 106.1503);
  assert.ok(dist >= 18000 && dist <= 19500, `Expected ~18.5 km, got ${dist}`);
});

test('calculateRoadDistance accurately reflects real-world road network distance', () => {
  const cilegonLat = -5.9860;
  const cilegonLng = 106.0520;

  // 1. Serang: benchmark 21.5 km
  const serangDist = calculateRoadDistance(cilegonLat, cilegonLng, -6.1202, 106.1503, 21500, 'driving');
  assert.equal(serangDist, 21500);
  assert.equal(formatDistance(serangDist), '21.5 km');

  // 2. Merak: benchmark 14.4 km (real road, NOT straight line 8 km)
  const merakDist = calculateRoadDistance(cilegonLat, cilegonLng, -5.9328, 106.0025, 14400, 'driving');
  assert.equal(merakDist, 14400);
  assert.equal(formatDistance(merakDist), '14.4 km');

  // 3. Pandeglang: benchmark 45.4 km (real road, NOT straight line 36.3 km)
  const pandeglangDist = calculateRoadDistance(cilegonLat, cilegonLng, -6.3088, 106.1065, 45400, 'driving');
  assert.equal(pandeglangDist, 45400);
  assert.equal(formatDistance(pandeglangDist), '45.4 km');

  // 4. Balai Kota Cilegon: benchmark 4.55 km (real road, NOT straight line 1.9 km)
  const balaiKotaDist = calculateRoadDistance(cilegonLat, cilegonLng, -6.0023, 106.0572, 4550, 'driving');
  assert.equal(balaiKotaDist, 4550);
  assert.equal(formatDistance(balaiKotaDist), '4.5 km');

  // 5. Ibu Ratna (walking): benchmark 2.07 km
  const ibuRatnaDist = calculateRoadDistance(cilegonLat, cilegonLng, -5.9921, 106.0401, 2070, 'walking');
  assert.equal(ibuRatnaDist, 2070);
  assert.equal(formatDistance(ibuRatnaDist), '2.1 km');
});

test('formatTravelTime matches Google Maps real-world benchmarks', () => {
  // Google Maps benchmark 1: Cilegon-Serang (21.5 km) is 38 min for motor
  const serangTime = formatTravelTime(21500, 'driving');
  assert.match(serangTime, /38 mnt motor/);
  assert.match(serangTime, /41 mnt mobil/);

  // Google Maps benchmark 2: Walking 2.1 km is ~26 minutes
  const walkTime = formatTravelTime(2070, 'walking');
  assert.match(walkTime, /26 mnt jalan kaki/);

  // Google Maps benchmark 3: Short trip (4.5 km to Balai Kota)
  const balaiKotaTime = formatTravelTime(4550, 'driving');
  assert.match(balaiKotaTime, /8 mnt motor · 9 mnt mobil/);

  // Regional trip (> 60 min, Pandeglang 45.4 km)
  const pandeglangTime = formatTravelTime(45400, 'driving');
  assert.match(pandeglangTime, /1j 20m berkendara/);
});
