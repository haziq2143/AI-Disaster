const ALLOWED_HAZARDS = new Set(['banjir', 'gempa', 'kebakaran', 'longsor', 'erupsi', 'lainnya', 'darurat']);
const ALLOWED_URGENCY_LEVELS = new Set(['KRITIS', 'TINGGI', 'SEDANG', 'RENDAH']);

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

export function validateEmergencyReport(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    invalid('Data laporan SOS tidak valid.');
  }

  const { lat, lng, precision_consent: precisionConsent } = body;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    invalid('Koordinat GPS tidak valid.');
  }
  if (precisionConsent !== true) {
    invalid('Persetujuan berbagi lokasi presisi diperlukan untuk laporan SOS.');
  }
  if (typeof body.hazard_type !== 'string' || !ALLOWED_HAZARDS.has(body.hazard_type)) {
    invalid('Jenis keadaan darurat tidak valid.');
  }
  if (body.urgency_level !== undefined && !ALLOWED_URGENCY_LEVELS.has(body.urgency_level)) {
    invalid('Tingkat urgensi tidak valid.');
  }

  const needsDescription = body.needs_description ?? 'Butuh bantuan segera di titik GPS.';
  const vulnerableMembers = body.vulnerable_members ?? 'Tidak terdata';
  if (typeof needsDescription !== 'string' || needsDescription.length > 1000) {
    invalid('Uraian kebutuhan bantuan maksimal 1.000 karakter.');
  }
  if (typeof vulnerableMembers !== 'string' || vulnerableMembers.length > 500) {
    invalid('Informasi anggota rentan maksimal 500 karakter.');
  }

  return {
    lat,
    lng,
    hazard_type: body.hazard_type,
    urgency_level: body.urgency_level || 'KRITIS',
    needs_description: needsDescription.trim() || 'Butuh bantuan segera di titik GPS.',
    vulnerable_members: vulnerableMembers.trim(),
    precision_consent: true
  };
}
