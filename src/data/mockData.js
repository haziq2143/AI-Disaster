export const HAZARD_TYPES = [
  { id: 'banjir', label: 'Banjir', icon: 'Waves', desc: 'Air naik, genangan tinggi, arus deras' },
  { id: 'gempa', label: 'Gempa Bumi', icon: 'Activity', desc: 'Guncangan tanah, retakan bangunan' },
  { id: 'kebakaran', label: 'Kebakaran', icon: 'Flame', desc: 'Api membesar, asap tebal, bau hangus' },
  { id: 'longsor', label: 'Tanah Longsor', icon: 'Mountain', desc: 'Pergerakan lereng, suara gemuruh' },
  { id: 'erupsi', label: 'Erupsi Gunung', icon: 'Volcano', desc: 'Hujan abu, awan panas, tremor' },
  { id: 'lainnya', label: 'Situasi Lainnya', icon: 'HelpCircle', desc: 'Kondisi anomali atau ancaman darurat lain' }
];

export const INITIAL_CHECKLIST = [
  { id: 'c1', label: 'Dokumen penting (KTP, KK, Ijazah, Polis) dalam kantong kedap air', category: 'Dokumen', completed: false, essential: true },
  { id: 'c2', label: 'Air minum kemasan (min. 1.5 Liter per orang)', category: 'Pangan & Air', completed: false, essential: true },
  { id: 'c3', label: 'Obat-obatan rutin pribadi & kotak P3K darurat', category: 'Kesehatan', completed: false, essential: true },
  { id: 'c4', label: 'Lampu senter / headlamp & baterai cadangan', category: 'Peralatan', completed: false, essential: true },
  { id: 'c5', label: 'Powerbank dengan daya penuh & kabel pengisi daya', category: 'Peralatan', completed: false, essential: true },
  { id: 'c6', label: 'Peluit darurat (untuk sinyal bantuan tanpa membuang tenaga)', category: 'Keselamatan', completed: false, essential: false },
  { id: 'c7', label: 'Pakaian ganti hangat, jas hujan ringan, dan alas kaki tertutup', category: 'Sandang', completed: false, essential: false },
  { id: 'c8', label: 'Masker pelindung pernapasan (N95 / medis anti-debu & asap)', category: 'Kesehatan', completed: false, essential: false },
];

export const INITIAL_FAMILY = [
  { id: 'f1', name: 'Dina (Anda)', relationship: 'Kepala Keluarga', supportNeeds: 'Tidak ada kebutuhan khusus', status: 'together' },
  { id: 'f2', name: 'Ibu Ratna', relationship: 'Orang Tua / Lansia', supportNeeds: 'Bantuan mobilitas (kursi roda / dipapah), obat hipertensi', status: 'together' },
  { id: 'f3', name: 'Arka', relationship: 'Anak (5 tahun)', supportNeeds: 'Perlu digandeng / digendong, susu formula balita', status: 'unconfirmed' },
];

export const INITIAL_EVACUATION_POINTS = [
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

export const OFFICIAL_SOURCES = [
  { name: 'BMKG Early Warning System', update: '10 menit lalu', verified: true, contact: '196' },
  { name: 'BPBD / SAR Posko Terpadu', update: '15 menit lalu', verified: true, contact: '112 / 115' },
  { name: 'PMI (Palang Merah Indonesia)', update: '28 menit lalu', verified: true, contact: '021-7992325' }
];
