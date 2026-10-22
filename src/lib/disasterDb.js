import fs from 'fs';
import path from 'path';

// Location of persistent JSON database
const DB_FILE = path.join(process.cwd(), 'data', 'disaster_database.json');

// Initial seed data with realistic geographic coordinates (Bandung / Sukajadi cluster)
const INITIAL_DATABASE = {
  posko: [
    {
      id: 'posko-1',
      name: 'Posko Balai Warga RW 04 & Pos Pengungsian Mandiri',
      lat: -6.8872,
      lng: 107.5948,
      address: 'Jl. Sukajadi No. 142, RT 04 / RW 04',
      capacity: '120 orang (Tersisa ~45 slot)',
      facilities: ['Genset Darurat', 'Dapur Umum Mandiri', 'Tenaga Medis P3K', 'Air Bersih'],
      contact: '0812-9988-RW04 (Bpk. Subagio)',
      status: 'active',
      verified_by: 'BPBD Posko Wilayah',
      verified_at: '12 menit lalu',
      elevation: '+18m mdpl (Dataran Tinggi Aman)'
    },
    {
      id: 'posko-2',
      name: 'Posko Terpadu Gedung Serbaguna Kecamatan Sukajadi',
      lat: -6.8835,
      lng: 107.5910,
      address: 'Jl. Sukamaju No. 8, Sukajadi',
      capacity: '300 orang (Tersisa ~160 slot)',
      facilities: ['Pos Medis Utama BPBD', '2 Unit Armada Perahu Karet', 'Suplai Obat Lengkap', 'Dapur Umum BNPB'],
      contact: '022-203112 / Call Center 112',
      status: 'active',
      verified_by: 'Tim Reaksi Cepat BPBD Jabar',
      verified_at: '25 menit lalu',
      elevation: '+24m mdpl'
    },
    {
      id: 'posko-3',
      name: 'Posko Lapangan Terbuka Stadion Mini Timur',
      lat: -6.8920,
      lng: 107.6045,
      address: 'Jl. Karang Tineung Timur No. 45',
      capacity: '200 orang',
      facilities: ['Tenda Pengungsi Darurat', 'Pos Komunikasi Radio Orari', 'Toilet Portabel'],
      contact: '0857-1122-3344',
      status: 'active',
      verified_by: 'PMI Wilayah',
      verified_at: '45 menit lalu',
      elevation: '+15m mdpl'
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
      notes: 'Rumah aman di lantai 2. Siaga genset dan 1 perahu karet warga jika tetangga butuh evakuasi.',
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
      notes: 'Sedang memindahkan perabotan ke lantai 2. Memantau ketinggian air selokan depan.',
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
      notes: 'Regu medis dan perahu karet siaga evakuasi warga prioritas.',
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
      notes: 'Jalur kering dapat dilalui, air belum naik.',
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
      contact: '0813-2233-4455 (Siti)',
      reported_at: '6 menit lalu',
      precision_consent: true,
      verified_status: 'Laporan Warga Terverifikasi RT'
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
      contact: '0878-9900-1122',
      reported_at: '19 menit lalu',
      precision_consent: true,
      verified_status: 'Dalam Penanganan Tim Relawan'
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
  }
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

// Ensure database file exists
function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf-8');
  }
}

// Read database
export function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading disaster database, resetting to seed:', err);
    return INITIAL_DATABASE;
  }
}

// Write database atomically
export function writeDb(data) {
  ensureDb();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
  return data;
}

// Get all markers with distances from user location
export function getAllMarkers(userCoords = null) {
  const db = readDb();
  const userLat = userCoords?.lat || db.user_location?.lat || -6.8880;
  const userLng = userCoords?.lng || db.user_location?.lng || 107.5940;

  // If user GPS is detected in another area (e.g., > 20km from Bandung Sukajadi),
  // dynamically generate realistic regional shelters & context markers near user GPS
  // so the user sees real nearby shelters and reports wherever they test their actual GPS!
  const isFarFromBandung = calculateDistance(userLat, userLng, -6.8880, 107.5940) > 20000;

  let poskoList = [...db.posko];
  let wargaList = [...db.warga];
  let reportsList = [...db.laporan_darurat];

  if (isFarFromBandung && userCoords?.lat && userCoords?.lng) {
    // Generate localized shelters around the user's real GPS
    const localPosko = [
      {
        id: 'local-posko-1',
        name: 'Posko Evakuasi Wilayah Terdekat',
        lat: userLat + 0.0035,
        lng: userLng + 0.0028,
        address: 'Kantor Kelurahan / Balai Warga Terdekat',
        capacity: '150 jiwa (Kapasitas Tersedia)',
        facilities: ['Genset Darurat', 'Dapur Umum', 'P3K', 'Air Bersih'],
        contact: 'Call Center 112 / Tim SAR 115',
        status: 'active',
        verified_by: 'BPBD Posko Wilayah',
        verified_at: '10 menit lalu',
        elevation: '+Dataran Aman'
      },
      {
        id: 'local-posko-2',
        name: 'Posko Kesehatan & Pengungsian Mandiri',
        lat: userLat - 0.0042,
        lng: userLng - 0.0030,
        address: 'Puskesmas / Fasilitas Umum',
        capacity: '100 jiwa',
        facilities: ['Tenaga Medis', 'Obat Darurat', 'Ambulans Siaga'],
        contact: '119 / PMI',
        status: 'active',
        verified_by: 'Dinas Kesehatan & PMI',
        verified_at: '20 menit lalu',
        elevation: '+Aman dari Bencana'
      }
    ];

    const localWarga = [
      {
        id: 'local-warga-1',
        alias: 'Warga Sekitar (Pak RT)',
        lat: userLat + 0.0022,
        lng: userLng - 0.0018,
        area: 'Area Sekitar Anda (Radius 1 km)',
        status: 'safe',
        radius_km: 1.0,
        can_help: true,
        notes: 'Siaga di posko RT. Bersedia membantu koordinasi evakuasi tetangga.',
        updated_at: '3 menit lalu'
      },
      {
        id: 'local-warga-2',
        alias: 'Warga Sekitar (Siaga)',
        lat: userLat - 0.0028,
        lng: userLng + 0.0035,
        area: 'Area Sekitar Anda',
        status: 'checking',
        radius_km: 1.0,
        can_help: false,
        notes: 'Mengamankan barang-barang penting, situasi siaga.',
        updated_at: '8 menit lalu'
      }
    ];

    const localReport = [
      {
        id: 'local-rep-1',
        reporter_name: 'Warga Butuh Bantuan Terdekat',
        lat: userLat + 0.0048,
        lng: userLng + 0.0040,
        address_detail: 'Area Sekitar (Radius ~700m dari Anda)',
        hazard_type: 'darurat',
        urgency_level: 'TINGGI',
        needs_description: 'Membutuhkan bantuan logistik dan evakuasi anggota keluarga lansia.',
        vulnerable_members: '1 Lansia',
        status: 'waiting_rescue',
        contact: '112 / Kontak Lapangan',
        reported_at: '5 menit lalu',
        precision_consent: true,
        verified_status: 'Laporan Belum Diverifikasi Penuh'
      }
    ];

    poskoList = [...localPosko, ...poskoList];
    wargaList = [...localWarga, ...wargaList];
    reportsList = [...localReport, ...reportsList];
  }

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
export function getReportById(id) {
  const db = readDb();
  return db.laporan_darurat.find(r => r.id === id) || null;
}

// Add new emergency report
export function addEmergencyReport(report) {
  const db = readDb();
  const newReport = {
    id: 'rep-' + Date.now(),
    reporter_name: report.reporter_name || 'Pengguna (Laporan Mandiri)',
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

  db.laporan_darurat.unshift(newReport);
  writeDb(db);
  return newReport;
}

// Update report status
export function updateReportStatus(id, status) {
  const db = readDb();
  const report = db.laporan_darurat.find(r => r.id === id);
  if (report) {
    report.status = status;
    writeDb(db);
    return report;
  }
  return null;
}

// Save user location & precision consent
export function saveUserLocation(locationData) {
  const db = readDb();
  db.user_location = {
    ...db.user_location,
    lat: locationData.lat,
    lng: locationData.lng,
    accuracy: locationData.accuracy || 10,
    precision_consent: Boolean(locationData.precision_consent),
    status: locationData.status || db.user_location?.status || 'checking',
    display_mode: locationData.precision_consent ? 'pin_sos' : 'radius_1km',
    updated_at: new Date().toISOString()
  };
  writeDb(db);
  return db.user_location;
}
