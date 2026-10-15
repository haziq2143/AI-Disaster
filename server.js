import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`AI Disaster Assistant Backend API running on port ${PORT}`);
});
