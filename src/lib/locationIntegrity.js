import { calculateDistance } from './geoUtils.js';

/**
 * Evaluates location reading integrity using behavioral heuristics (PRD Section 4.13 Anti-Spoofing).
 * Designed for web environments where OS-level mock location APIs (e.g. Android isFromMockProvider)
 * are not directly exposed to the browser.
 * 
 * @param {Object} current - { lat, lng, accuracy, timestamp, speed, altitude, isMock }
 * @param {Object} [previous] - { lat, lng, accuracy, timestamp }
 * @returns {Object} Integrity assessment with multi-level public label
 */
export function evaluateLocationIntegrity(current, previous = null) {
  if (!current || !Number.isFinite(current.lat) || !Number.isFinite(current.lng)) {
    return {
      status: 'flagged',
      publicLabel: 'Sedang ditinjau',
      riskScore: 90,
      indicators: ['Koordinat tidak valid atau non-numerik.'],
      demoNotice: 'DATA DEMO — Hasil penilaian heuristik web prototipe'
    };
  }

  const indicators = [];
  let riskScore = 0;

  // Signal 1: Native Mock Indicator flag (if injected by Android PWA or test provider)
  if (current.isMock === true) {
    indicators.push('Sinyal mock provider terdeteksi dari antarmuka sistem perangkat.');
    riskScore += 70;
  }

  // Signal 2: Artificial or Zero Accuracy
  // True GPS satellite chips inherently possess measurement tolerances (typically ±3m to ±50m).
  // Mock GPS apps often hardcode accuracy to exact 0.
  if (current.accuracy === 0) {
    indicators.push('Akurasi terbaca 0 meter (indikasi koordinat injeksi/manual).');
    riskScore += 45;
  } else if (current.accuracy > 3000) {
    indicators.push('Akurasi terlalu rendah (> 3.000 m).');
    riskScore += 20;
  }

  // Signal 3: Timestamp & Freshness anomaly
  const now = Date.now();
  const readingTime = current.timestamp ? new Date(current.timestamp).getTime() : now;
  const timeDeltaMs = now - readingTime;

  if (timeDeltaMs < -60000) {
    // Timestamp from more than 1 min in future
    indicators.push('Waktu pembacaan GPS mendahului waktu sistem (anomali jam perangkat).');
    riskScore += 35;
  } else if (timeDeltaMs > 86400000) {
    // Stale reading > 24 hours old
    indicators.push('Data lokasi kedaluwarsa (> 24 jam).');
    riskScore += 25;
  }

  // Signal 4: Teleportation / Unrealistic Velocity Check
  if (previous && Number.isFinite(previous.lat) && Number.isFinite(previous.lng)) {
    const prevTime = previous.timestamp ? new Date(previous.timestamp).getTime() : now - 10000;
    const intervalSec = Math.max(1, (readingTime - prevTime) / 1000);
    const distMeters = calculateDistance(previous.lat, previous.lng, current.lat, current.lng);
    const speedKmh = (distMeters / intervalSec) * 3.6;

    // Check unrealistic speed:
    // Evacuee/car rarely exceeds 160 km/h in disaster conditions.
    // > 400 km/h indicates coordinate teleportation / fake GPS jumping.
    if (distMeters > 500 && speedKmh > 400) {
      indicators.push(`Perpindahan tidak wajar: ${Math.round(distMeters)} m dalam ${Math.round(intervalSec)} detik (${Math.round(speedKmh)} km/jam).`);
      riskScore += 60;
    } else if (distMeters > 1000 && speedKmh > 180) {
      indicators.push(`Kecepatan perpindahan sangat tinggi (${Math.round(speedKmh)} km/jam).`);
      riskScore += 30;
    }
  }

  // Determine multi-level verification status compliant with PRD Section 4.13:
  // Tingkat 1 (clean): tidak ditemukan indikator -> "Lokasi belum diverifikasi secara menyeluruh"
  // Tingkat 2 (caution): indikator lemah -> "Perlu verifikasi tambahan"
  // Tingkat 3 (flagged): indikator kuat -> "Sedang ditinjau"
  let status = 'clean';
  let publicLabel = 'Lokasi belum diverifikasi secara menyeluruh';

  if (riskScore >= 50) {
    status = 'flagged';
    publicLabel = 'Sedang ditinjau';
  } else if (riskScore >= 20) {
    status = 'caution';
    publicLabel = 'Perlu verifikasi tambahan';
  }

  return {
    status,
    publicLabel,
    riskScore,
    indicators,
    demoNotice: 'DATA DEMO — Hasil penilaian heuristik web prototipe (PRD 4.13)',
    timestamp: new Date().toISOString()
  };
}
