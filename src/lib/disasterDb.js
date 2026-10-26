import { randomUUID } from 'node:crypto';
import { mutateDocument, readDocument } from './database.js';

const STORE_KEY = 'disaster_database';

// Static demonstration data; values are not verified operational information.
export const INITIAL_DATABASE = {
  posko: [
    {
      id: 'posko-1',
      name: 'Posko Balai Warga RW 04 & Pos Pengungsian Mandiri',
      lat: -6.8872,
      lng: 107.5948,
      address: 'Jl. Sukajadi No. 142, RT 04 / RW 04',
      capacity: 'Tidak tersedia · data demo',
      facilities: [],
      contact: 'Tidak tersedia · data demo',
      status: 'unverified',
      verified_by: 'DATA DEMO — bukan verifikasi instansi',
      verified_at: 'Contoh statis — bukan waktu pembaruan',
      elevation: 'Tidak diverifikasi'
    },
    {
      id: 'posko-2',
      name: 'Posko Terpadu Gedung Serbaguna Kecamatan Sukajadi',
      lat: -6.8835,
      lng: 107.5910,
      address: 'Jl. Sukamaju No. 8, Sukajadi',
      capacity: 'Tidak tersedia · data demo',
      facilities: [],
      contact: 'Tidak tersedia · data demo',
      status: 'unverified',
      verified_by: 'DATA DEMO — bukan verifikasi instansi',
      verified_at: 'Contoh statis — bukan waktu pembaruan',
      elevation: 'Tidak diverifikasi'
    },
    {
      id: 'posko-3',
      name: 'Posko Lapangan Terbuka Stadion Mini Timur',
      lat: -6.8920,
      lng: 107.6045,
      address: 'Jl. Karang Tineung Timur No. 45',
      capacity: 'Tidak tersedia · data demo',
      facilities: [],
      contact: 'Tidak tersedia · data demo',
      status: 'unverified',
      verified_by: 'DATA DEMO — bukan verifikasi instansi',
      verified_at: 'Contoh statis — bukan waktu pembaruan',
      elevation: 'Tidak diverifikasi'
    }
  ],
  warga: [
    {
      id: 'warga-1',
      alias: 'Pak Hendra (Ketua RT 02)',
      lat: -6.8858,
      lng: 107.5932,
      area: 'Sukajadi Utara, RT 02',
      status: 'safe',
      radius_km: 1.0,
      can_help: true,
      notes: 'Profil warga contoh; lokasi, status, dan ketersediaan bantuan tidak diverifikasi.',
      updated_at: '4 menit lalu'
    },
    {
      id: 'warga-2',
      alias: 'Keluarga Bu Ratmi',
      lat: -6.8895,
      lng: 107.5978,
      area: 'Gang Kenanga, RT 03',
      status: 'checking',
      radius_km: 1.0,
      can_help: false,
      notes: 'Profil warga contoh; lokasi dan kondisi tidak diverifikasi.',
      updated_at: '11 menit lalu'
    },
    {
      id: 'warga-3',
      alias: 'Relawan Siaga PMI Sukajadi',
      lat: -6.8865,
      lng: 107.5955,
      area: 'Balai RW 04',
      status: 'safe',
      radius_km: 1.0,
      can_help: true,
      notes: 'Profil warga contoh; identitas, fasilitas, dan kesiapsiagaan tidak diverifikasi.',
      updated_at: '7 menit lalu'
    },
    {
      id: 'warga-4',
      alias: 'Warga Anonim • Cempaka',
      lat: -6.8812,
      lng: 107.6020,
      area: 'Cempaka Barat',
      status: 'safe',
      radius_km: 1.0,
      can_help: false,
      notes: 'Profil warga contoh; jalur dan kondisi tidak diverifikasi.',
      updated_at: '18 menit lalu'
    }
  ],
  laporan_darurat: [
    {
      id: 'rep-sos-1',
      reporter_name: 'Ibu Siti & Balita',
      lat: -6.8905,
      lng: 107.5965,
      address_detail: 'Gang Melati No. 12, RT 04 / RW 04 Sukajadi',
      hazard_type: 'banjir',
      urgency_level: 'KRITIS',
      needs_description: 'Air di dalam rumah sudah setinggi 65 cm dan terus mengalir deras. Terdapat 1 bayi usia 2 tahun dan ibu yang terjebak di atas meja. Butuh perahu karet segera!',
      vulnerable_members: '1 Bayi/Balita (2 tahun), 1 Lansia (68 tahun)',
      status: 'waiting_rescue',
      contact: 'Tidak tersedia · data demo',
      reported_at: 'Data contoh — bukan waktu laporan',
      precision_consent: true,
      verified_status: 'DATA DEMO — belum diverifikasi'
    },
    {
      id: 'rep-sos-2',
      reporter_name: 'Keluarga Bpk. Rahmat',
      lat: -6.8845,
      lng: 107.5925,
      address_detail: 'Jl. Sukamulya No. 22, RT 01 / RW 03',
      hazard_type: 'banjir',
      urgency_level: 'TINGGI',
      needs_description: 'Tanggul selokan perumahan meluap setinggi 45 cm. Terdapat orang tua lansia yang harus memakai kursi roda, tidak dapat dievakuasi sendiri tanpa bantuan tandu/perahu.',
      vulnerable_members: '1 Lansia (kursi roda / lumpuh sebagian)',
      status: 'in_progress',
      contact: 'Tidak tersedia · data demo',
      reported_at: 'Data contoh — bukan waktu laporan',
      precision_consent: true,
      verified_status: 'DATA DEMO — status contoh'
    }
  ],
  user_location: {
    lat: -6.8880,
    lng: 107.5940,
    accuracy: 12,
    precision_consent: false,
    status: 'checking',
    display_mode: 'radius_1km',
    updated_at: new Date().toISOString()
  },
  road_hazards: []
};

// Calculate Haversine distance in meters
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function readDb() {
  return readDocument(STORE_KEY, INITIAL_DATABASE);
}

export function writeDb(data) {
  return mutateDocument(STORE_KEY, INITIAL_DATABASE, current => {
    for (const key of Object.keys(current)) delete current[key];
    Object.assign(current, data);
    return current;
  });
}

export async function getRoadHazards() {
  const db = await readDb();
  return (Array.isArray(db.road_hazards) ? db.road_hazards : [])
    .filter(hazard => hazard.data_status === 'live' && hazard.status === 'verified');
}

export async function toggleRoadHazard(id, activeState = null) {
  return mutateDocument(STORE_KEY, INITIAL_DATABASE, db => {
    const hazard = (Array.isArray(db.road_hazards) ? db.road_hazards : [])
      .find(item => item.id === id && item.data_status === 'live' && item.status === 'verified');
    if (!hazard) return null;
    hazard.active = activeState !== null ? Boolean(activeState) : !hazard.active;
    hazard.updated_at = new Date().toISOString();
    return hazard;
  });
}

// Get all markers with distances from user location
export async function getAllMarkers(userCoords = null) {
  const db = await readDb();
  const userLat = userCoords?.lat ?? -6.8880;
  const userLng = userCoords?.lng ?? 107.5940;

  let poskoList = [...db.posko];
  let wargaList = [...db.warga];
  let reportsList = [...db.laporan_darurat];

  // Calculate distance from user for each marker
  const withDistance = items =>
    items.map(item => {
      const dist = calculateDistance(userLat, userLng, item.lat, item.lng);
      return {
        ...item,
        distanceMeters: dist,
        distanceFormatted: dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} meter`,
        estWalkTime: `${Math.max(1, Math.round(dist / 80))} menit`
      };
    });

  return {
    posko: withDistance(poskoList).sort((a, b) => a.distanceMeters - b.distanceMeters),
    warga: withDistance(wargaList).sort((a, b) => a.distanceMeters - b.distanceMeters),
    laporan_darurat: withDistance(reportsList).sort((a, b) => a.distanceMeters - b.distanceMeters),
    user_location: {
      ...db.user_location,
      lat: userLat,
      lng: userLng
    }
  };
}

// Get single emergency report
export async function getReportById(id) {
  const db = await readDb();
  return db.laporan_darurat.find(r => r.id === id) || null;
}

// Add new emergency report
export function addEmergencyReport(report) {
  const newReport = {
    id: `rep-${randomUUID()}`,
    reporter_name: report.reporter_name || 'Pengguna (Laporan Mandiri)',
    reporter_user_id: report.reporter_user_id,
    source_type: 'user_report',
    lat: report.lat,
    lng: report.lng,
    address_detail: report.address_detail || 'Lokasi GPS Pengguna',
    hazard_type: report.hazard_type || 'darurat',
    urgency_level: report.urgency_level || 'KRITIS',
    needs_description: report.needs_description || 'Butuh bantuan segera di titik GPS.',
    vulnerable_members: report.vulnerable_members || 'Tidak terdata',
    status: 'waiting_rescue',
    contact: report.contact || 'Layanan Darurat 112',
    reported_at: 'Baru saja',
    precision_consent: Boolean(report.precision_consent),
    verified_status: 'Laporan Baru (Sedang Diverifikasi)'
  };

  return mutateDocument(STORE_KEY, INITIAL_DATABASE, db => {
    db.laporan_darurat.unshift(newReport);
    return newReport;
  });
}

export function addPosko(posko) {
  const newPosko = {
    id: `posko-${randomUUID()}`,
    name: posko.name,
    lat: posko.lat,
    lng: posko.lng,
    address: posko.address,
    capacity: 'Belum diinformasikan',
    facilities: [],
    contact: posko.contact || 'Belum diinformasikan',
    status: 'unverified',
    verified_by: `Kontribusi akun SAR: ${posko.created_by}`,
    verified_at: new Date().toISOString(),
    source_type: 'sar_contribution'
  };
  return mutateDocument(STORE_KEY, INITIAL_DATABASE, db => {
    db.posko.unshift(newPosko);
    return newPosko;
  });
}

// Update report status
export async function updateReportStatus(id, status) {
  if (!['waiting_rescue', 'in_progress', 'resolved'].includes(status)) {
    throw new Error('Status laporan tidak valid.');
  }
  return mutateDocument(STORE_KEY, INITIAL_DATABASE, db => {
    const report = db.laporan_darurat.find(r => r.id === id);
    if (!report) return null;
    report.status = status;
    return report;
  });
}
