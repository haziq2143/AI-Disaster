import express from 'express';
import cors from 'cors';
import { 
  getAllMarkers, 
  addEmergencyReport, 
  addPosko,
  getReportById, 
  updateReportStatus 
} from './src/lib/disasterDb.js';
import { getUserForSession } from './src/lib/authStore.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function sessionUser(req) {
  const cookie = (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith('disaster_session='));
  if (!cookie) return null;
  try {
    return getUserForSession(decodeURIComponent(cookie.slice('disaster_session='.length)));
  } catch (error) {
    console.error('Gagal memeriksa sesi pada Express API:', error);
    return null;
  }
}

function requireRole(role) {
  return (req, res, next) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Silakan masuk untuk melanjutkan.' });
    if (role === 'sar' && user.role !== 'sar') {
      return res.status(403).json({ success: false, error: 'Fitur ini khusus akun Tim SAR.' });
    }
    req.authUser = user;
    next();
  };
}

// In-Memory Database for Prototype Demo
let situationReports = [];
let familyMembers = [
  { id: 'f1', name: 'Dina (Anda)', relationship: 'Kepala Keluarga', supportNeeds: 'Tidak ada kebutuhan khusus', status: 'together' },
  { id: 'f2', name: 'Ibu Ratna', relationship: 'Orang Tua / Lansia', supportNeeds: 'Bantuan mobilitas (kursi roda / dipapah), obat hipertensi', status: 'together' },
  { id: 'f3', name: 'Arka', relationship: 'Anak (5 tahun)', supportNeeds: 'Perlu digandeng / digendong, susu formula balita', status: 'unconfirmed' },
];

let evacuationPoints = [
  {
    id: 'ev-1',
    name: 'Balai Warga RW 04 & Pos Pengungsian Mandiri',
    distance: '350 meter',
    estTime: '5-7 menit jalan kaki',
    capacity: 'Kapasitas tersisa ~80 jiwa (Luas)',
    status: 'TERVERIFIKASI',
    verifiedAt: '12 menit lalu oleh BPBD Posko Wilayah',
    elevation: 'Elevasi tinggi (+18m mdpl)',
    notes: 'Akses melalui Jalan Mawar aman dari genangan air. Tersedia tenaga medis lapangan dan genset.',
    isRecommended: true
  },
  {
    id: 'ev-2',
    name: 'Gedung Serbaguna Kecamatan Utama',
    distance: '1.2 km',
    estTime: '15-20 menit',
    capacity: 'Kapasitas besar, dapur umum aktif',
    status: 'TERVERIFIKASI',
    verifiedAt: '25 menit lalu oleh Tim Reaksi Cepat',
    elevation: 'Elevasi tinggi (+24m mdpl)',
    notes: 'Jalur via Jalan Protokol padat merayap, disarankan menggunakan jalur alternatif pejalan kaki.',
    isRecommended: false
  },
  {
    id: 'ev-3',
    name: 'Lapangan Terbuka Stadion Mini Timur',
    distance: '850 meter',
    estTime: 'Status rute belum terverifikasi',
    capacity: 'Area terbuka luas',
    status: 'BELUM TERVERIFIKASI',
    verifiedAt: 'Terakhir dicek 2 jam lalu',
    elevation: 'Dataran sedang',
    notes: 'Peringatan: Terdapat laporan pohon tumbang di persimpangan timur. Hindari sebelum petugas memverifikasi.',
    isRecommended: false
  }
];

let checklistItems = [
  { id: 'c1', label: 'Dokumen penting (KTP, KK, Ijazah, Polis) dalam kantong kedap air', category: 'Dokumen', completed: false, essential: true },
  { id: 'c2', label: 'Air minum kemasan (min. 1.5 Liter per orang)', category: 'Pangan & Air', completed: false, essential: true },
  { id: 'c3', label: 'Obat-obatan rutin pribadi & kotak P3K darurat', category: 'Kesehatan', completed: false, essential: true },
  { id: 'c4', label: 'Lampu senter / headlamp & baterai cadangan', category: 'Peralatan', completed: false, essential: true },
  { id: 'c5', label: 'Powerbank dengan daya penuh & kabel pengisi daya', category: 'Peralatan', completed: false, essential: true },
  { id: 'c6', label: 'Peluit darurat (untuk sinyal bantuan tanpa membuang tenaga)', category: 'Keselamatan', completed: false, essential: false },
  { id: 'c7', label: 'Pakaian ganti hangat, jas hujan ringan, dan alas kaki tertutup', category: 'Sandang', completed: false, essential: false },
  { id: 'c8', label: 'Masker pelindung pernapasan (N95 / medis anti-debu & asap)', category: 'Kesehatan', completed: false, essential: false },
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Disaster Assistant Backend API is running',
    timestamp: new Date().toISOString(),
    isDemo: true
  });
});

// 1. AI Situation Assessment Engine (PRD 4.3 & 5.2 AI Output Contract)
app.post('/api/assessment', (req, res) => {
  const { hazard_type, user_description, clarifications, location } = req.body;

  // Validation
  if (!hazard_type || !user_description) {
    return res.status(400).json({ error: 'hazard_type and user_description are required.' });
  }

  // Construct assessment following PRD 5.2 AI Output Contract
  let result = {};

  if (hazard_type === 'gempa') {
    result = {
      situation_summary: `Guncangan gempa bumi telah mengakibatkan keretakan dinding bangunan dan terputusnya aliran listrik di area ${location || 'sekitar Anda'}.`,
      confidence_limitation: 'AI tidak dapat menguji integritas struktural beton tanpa inspeksi ahli. Hindari bertahan di bawah kanopi rapuh.',
      urgency_level: 'TINGGI — PRIORITAS EVAKUASI KE RUANG TERBUKA',
      known_conditions: [
        'Guncangan telah terjadi, ada potensi gempa susulan.',
        'Dinding retak, berisiko runtuh jika terjadi gempa susulan.',
        'Kondisi listrik padam memerlukan penerangan darurat mandiri.'
      ],
      missing_information: [
        'Integritas pondasi struktural balok bangunan.',
        'Kondisi pipa gas / instalasi listrik tetangga sekitar.'
      ],
      immediate_actions: [
        { title: 'Jauhi bangunan dan tiang listrik', desc: 'Segera bergerak ke tanah lapang, taman, atau jalan lebar tanpa kanopi rapuh.', critical: true },
        { title: 'Matikan MCB / Sekring Utama', desc: 'Cegah kebakaran akibat korsleting saat listrik kembali menyala.', critical: true },
        { title: 'Lindungi kepala dengan tas / helm', desc: 'Gunakan pelindung kepala saat bergerak melintasi puing dan reruntuhan.', critical: false }
      ],
      next_steps: [
        'Jangan langsung masuk kembali ke dalam rumah untuk mengambil barang.',
        'Nyalakan radio darurat atau pantau informasi resmi BMKG untuk update magnitudo dan potensi susulan.',
        'Verifikasi status fisik setiap anggota keluarga.'
      ],
      source_and_freshness: 'Panduan Mitigasi Gempa BNPB & BMKG (Disimulasikan)',
      escalation: 'Jika ada korban terperangkap reruntuhan, segera hubungi Basarnas / Tim SAR di 115 atau 112.'
    };
  } else if (hazard_type === 'kebakaran') {
    result = {
      situation_summary: `Ancaman asap pekat dan potensi rambatan api di area sekitar ${location || 'tempat tinggal Anda'}. Kualitas udara menurun drastis.`,
      confidence_limitation: 'Kecepatan api dan arah angin dapat berubah sewaktu-waktu. Rekomendasi memprioritaskan keselamatan jiwa di atas harta benda.',
      urgency_level: 'KRITIS — SEGERA EVAKUASI MENJAUHI ARAH ANGIN',
      known_conditions: [
        'Asap pekat dapat memicu keracunan gas monoksida dalam hitungan menit.',
        'Api berpotensi menyambar material mudah terbakar.',
        'Arah angin menentukan pergerakan asap beracun.'
      ],
      missing_information: [
        'Apakah akses jalan utama tertutup armada pemadam atau api.',
        'Keberadaan tabung gas / bahan kimia berbahaya di sekitar titik api.'
      ],
      immediate_actions: [
        { title: 'Tutup hidung & mulut dengan kain basah', desc: 'Rendahkan posisi tubuh (merangkak) jika asap tebal karena udara bersih ada di bawah.', critical: true },
        { title: 'Keluar segera bersama seluruh anggota keluarga', desc: 'Tinggalkan seluruh barang berharga, nyawa adalah prioritas tunggal.', critical: true },
        { title: 'Periksa daun pintu sebelum dibuka', desc: 'Sentuh gagang pintu dengan punggung tangan; jika panas, jangan dibuka!', critical: false }
      ],
      next_steps: [
        'Hubungi pemadam kebakaran 113 segera setelah berada di titik aman.',
        'Pastikan tidak ada orang yang tertinggal di dalam bangunan.',
        'Jangan pernah kembali masuk ke dalam gedung yang sedang terbakar.'
      ],
      source_and_freshness: 'Protokol Evakuasi Damkar & BPBD',
      escalation: 'Segera hubungi Pemadam Kebakaran di 113 atau Call Center 112.'
    };
  } else {
    // Banjir / Lainnya
    result = {
      situation_summary: `Genangan banjir aktif dengan arus mengalir di sekitar ${location || 'hunian Anda'}. Terdata lansia dan balita yang memerlukan pendampingan fisik.`,
      confidence_limitation: 'Ketinggian air dapat naik mendadak jika ada kiriman air hulu. Verifikasi rute secara berkala.',
      urgency_level: 'TINGGI — BUTUH EVAKUASI SEGERA SEBELUM AIR NAIK',
      known_conditions: [
        'Ketinggian air telah memasuki pekarangan/rumah dengan arus deras.',
        'Terdapat anggota keluarga dengan keterbatasan mobilitas (lansia & balita).',
        'Potensi bahaya sengatan listrik dan lubang saluran air tak terlihat.'
      ],
      missing_information: [
        'Kapasitas tersisa posko darurat terkini.',
        'Kondisi kedalaman arus di persimpangan jalan protokol.'
      ],
      immediate_actions: [
        { title: 'Matikan total meteran listrik (MCB) utama rumah', desc: 'Cegah sengatan listrik fatal di air banjir sebelum melangkah keluar.', critical: true },
        { title: 'Bantu lansia dan amankan balita terlebih dahulu', desc: 'Gunakan gendongan untuk balita dan dampingi lansia secara fisik di sisi kering.', critical: true },
        { title: 'Gunakan tongkat / payung untuk meraba pijakan kaki', desc: 'Pastikan tidak ada saluran got terbuka atau pecahan beling tak terlihat di dasar air.', critical: true }
      ],
      next_steps: [
        'Bawa tas siaga bencana (obat penting & dokumen kedap air).',
        'Bergerak ke posko evakuasi RW 04 yang berada di dataran tinggi.',
        'Tetap bersama kelompok dan hindari menyeberangi arus deras setinggi lutut.'
      ],
      source_and_freshness: 'Prosedur Tanggap Darurat Banjir BNPB',
      escalation: 'Jika air meluap cepat melebihi 1 meter dan terjebak, hubungi Call Center 112 untuk evakuasi perahu karet.'
    };
  }

  // Save report history in memory
  const newReport = {
    id: 'rep-' + Date.now(),
    hazard_type,
    user_description,
    location,
    clarifications,
    assessment: result,
    created_at: new Date().toISOString()
  };
  situationReports.push(newReport);

  res.status(200).json({
    success: true,
    report_id: newReport.id,
    data: result
  });
});

// 2. Family Safety APIs (PRD 4.5 & 5.3)
app.get('/api/family', (req, res) => {
  res.json({ success: true, data: familyMembers });
});

app.post('/api/family', (req, res) => {
  const { name, relationship, supportNeeds } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const newMember = {
    id: 'f-' + Date.now(),
    name,
    relationship: relationship || 'Anggota Keluarga',
    supportNeeds: supportNeeds || 'Tidak ada kebutuhan khusus',
    status: 'together'
  };
  familyMembers.push(newMember);
  res.status(201).json({ success: true, data: newMember });
});

app.patch('/api/family/:id/status', (req, res) => {
  const { id } = req.params;
  const member = familyMembers.find(m => m.id === id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  member.status = member.status === 'together' ? 'unconfirmed' : 'together';
  res.json({ success: true, data: member });
});

app.delete('/api/family/:id', (req, res) => {
  const { id } = req.params;
  familyMembers = familyMembers.filter(m => m.id !== id);
  res.json({ success: true, message: 'Member removed' });
});

// 3. Safe Route & Evacuation Points (PRD 4.6 & 5.3)
app.get('/api/evacuation-points', (req, res) => {
  res.json({
    success: true,
    label: 'DATA DEMO BERLABEL SIMULASI',
    data: evacuationPoints
  });
});

// 4. Emergency Checklist APIs (PRD 4.7 & 5.3)
app.get('/api/checklist', (req, res) => {
  res.json({ success: true, data: checklistItems });
});

app.patch('/api/checklist/:id/toggle', (req, res) => {
  const { id } = req.params;
  const item = checklistItems.find(c => c.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Checklist item not found' });
  }
  item.completed = !item.completed;
  res.json({ success: true, data: item });
});

// 5. Safe Confirmation Endpoint (PRD 4.8)
app.post('/api/confirm-safe', (req, res) => {
  const { location, registeredWithOfficer, timestamp } = req.body;
  res.json({
    success: true,
    message: 'Konfirmasi keamanan berhasil dicatat.',
    confirmation: {
      location: location || 'Posko Pengungsian',
      registeredWithOfficer: !!registeredWithOfficer,
      confirmed_at: timestamp || new Date().toISOString(),
      verified_by_user: true
    }
  });
});

// 6. Global Safety Map & 1km Radius / SOS Pin APIs (PRD 4.11 & 4.13)
let communityPins = [
  {
    id: 'user-me',
    isCurrentUser: true,
    alias: 'Anda (Dina)',
    area: 'Kelurahan Sukajadi, RT 02 / RW 04',
    x: 48,
    y: 52,
    status: 'checking',
    displayMode: 'radius_1km',
    radiusKm: 1.0,
    distanceMeters: 0,
    updated: 'Baru saja'
  },
  {
    id: 'p-hendra',
    alias: 'Pak Hendra (Ketua RT 02)',
    area: 'Sukajadi Utara, RT 02',
    x: 46,
    y: 36,
    status: 'safe',
    displayMode: 'radius_1km',
    radiusKm: 1.0,
    distanceMeters: 280,
    updated: '4 menit lalu',
    canHelp: true
  },
  {
    id: 'p-ratmi',
    alias: 'Keluarga Bu Ratmi',
    area: 'Gang Kenanga, RT 03',
    x: 62,
    y: 44,
    status: 'checking',
    displayMode: 'radius_1km',
    radiusKm: 1.0,
    distanceMeters: 520,
    updated: '11 menit lalu',
    canHelp: false
  },
  {
    id: 'p-pmi',
    alias: 'Posko Relawan Siaga PMI Sukajadi',
    area: 'Balai Warga RW 04',
    x: 36,
    y: 65,
    status: 'safe',
    displayMode: 'radius_1km',
    radiusKm: 1.0,
    distanceMeters: 750,
    updated: '7 menit lalu',
    isVolunteerPost: true,
    canHelp: true
  },
  {
    id: 'p-siti',
    alias: 'Ibu Siti & Balita (Butuh Bantuan)',
    area: 'Sukajadi Selatan, Gang Melati RT 04',
    x: 58,
    y: 69,
    status: 'help',
    displayMode: 'pin_sos',
    radiusKm: 1.0,
    distanceMeters: 890,
    updated: '2 menit lalu',
    urgent: true
  }
];

let abuseReports = [];

app.get('/api/safety-map/pins', (req, res) => {
  res.json({
    success: true,
    data: communityPins,
    privacyNotice: 'Default warga aman menggunakan radius 1km perkiraan. Warga darurat otomatis menggunakan PIN presisi.'
  });
});

app.post('/api/safety-map/toggle-emergency', (req, res) => {
  const { status } = req.body; // 'help' or 'safe'/'checking'
  const userPin = communityPins.find(p => p.id === 'user-me');
  if (userPin) {
    userPin.status = status || 'help';
    userPin.displayMode = status === 'help' ? 'pin_sos' : 'radius_1km';
    userPin.updated = 'Baru saja';
  }
  res.json({
    success: true,
    data: userPin,
    message: status === 'help' 
      ? 'Mode Darurat Aktif: Lokasi presisi dibuka sebagai PIN SOS kepada warga sekitar.' 
      : 'Mode Normal Aktif: Privasi dilindungi dengan radius perkiraan 1 km.'
  });
});

app.get('/api/safety-map/nearby', (req, res) => {
  const maxDistance = parseInt(req.query.maxDistance || '1000', 10);
  const nearby = communityPins.filter(p => !p.isCurrentUser && p.distanceMeters <= maxDistance);
  res.json({
    success: true,
    count: nearby.length,
    radiusKm: 1.0,
    data: nearby
  });
});

app.post('/api/safety-map/report', (req, res) => {
  const { pinId, reason } = req.body;
  const report = {
    id: 'rep-' + Date.now(),
    pinId,
    reason: reason || 'Lokasi tidak akurat',
    timestamp: new Date().toISOString(),
    status: 'under_review'
  };
  abuseReports.push(report);
  res.json({
    success: true,
    message: 'Laporan tercatat untuk peninjauan verifikasi anti-spoofing.',
    report
  });
});

// 7. Actual Database GPS & Leaflet + OpenStreetMap Integrated Endpoints
app.get('/api/map/markers', (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const userCoords = lat && lng ? { lat, lng } : null;
  const markers = getAllMarkers(userCoords);
  markers.laporan_darurat = [];
  markers.user_location = null;
  res.json({
    success: true,
    source: 'database',
    timestamp: new Date().toISOString(),
    privacy_notice: 'Radius 1 km perkiraan adalah visualisasi privasi, bukan jaminan validasi laporan anti-spoofing.',
    data: markers
  });
});

app.post('/api/map/user-location', (req, res) => {
  res.status(410).json({ success: false, error: 'Lokasi live tidak disimpan sebagai lokasi global. Gunakan laporan SOS dengan persetujuan eksplisit.' });
});

app.get('/api/map/emergency-reports', requireRole('sar'), (req, res) => {
  const markers = getAllMarkers();
  res.json({
    success: true,
    count: markers.laporan_darurat.length,
    data: markers.laporan_darurat
  });
});

app.post('/api/map/emergency-reports', (req, res) => {
  const user = sessionUser(req);
  const { lat, lng, needs_description, hazard_type, vulnerable_members, urgency_level, precision_consent } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number' || precision_consent !== true) {
    return res.status(400).json({ success: false, error: 'Koordinat GPS dan persetujuan berbagi lokasi presisi diperlukan untuk laporan SOS.' });
  }
  const report = addEmergencyReport({
    lat,
    lng,
    reporter_name: user?.name || 'Pengguna anonim',
    reporter_user_id: user?.id,
    hazard_type,
    urgency_level: urgency_level || 'KRITIS',
    needs_description,
    vulnerable_members,
    precision_consent: Boolean(precision_consent)
  });
  res.status(201).json({
    success: true,
    message: 'Laporan darurat berhasil dicatat ke database geospasial.',
    data: report
  });
});

app.get('/api/map/emergency-reports/:id', requireRole('sar'), (req, res) => {
  const report = getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Laporan darurat tidak ditemukan.' });
  }
  res.json({ success: true, data: report });
});

app.patch('/api/map/emergency-reports/:id', requireRole('sar'), (req, res) => {
  const updated = updateReportStatus(req.params.id, req.body.status);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Laporan darurat tidak ditemukan.' });
  }
  res.json({ success: true, message: 'Status laporan darurat diperbarui.', data: updated });
});

app.post('/api/map/markers', requireRole('sar'), (req, res) => {
  const { name, address, lat, lng, contact } = req.body;
  if (
    typeof name !== 'string' || name.trim().length < 2 || name.length > 120 ||
    typeof address !== 'string' || address.trim().length < 2 || address.length > 200 ||
    typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180
  ) {
    return res.status(400).json({ success: false, error: 'Data posko tidak valid.' });
  }
  const data = addPosko({ name: name.trim(), address: address.trim(), lat, lng, contact, created_by: req.authUser.name });
  return res.status(201).json({ success: true, data });
});

app.listen(PORT, () => {
  console.log(`AI Disaster Assistant Backend API running on port ${PORT}`);
});
