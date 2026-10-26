const guidanceByHazard = {
  banjir: {
    immediate_actions: [
      { title: 'Jangan masuk atau menyeberangi air banjir', desc: 'Arus, kedalaman, lubang, kabel, dan kontaminasi air tidak dapat dipastikan dari aplikasi.', critical: true },
      { title: 'Jauhi sumber listrik dan area yang tergenang', desc: 'Jangan menyentuh peralatan listrik atau panel yang basah/terendam.', critical: true },
      { title: 'Hubungi petugas setempat bila terancam', desc: 'Sampaikan lokasi dan kebutuhan melalui kanal darurat resmi yang tersedia di daerah Anda.', critical: true }
    ],
    next_steps: [
      'Ikuti arahan petugas mengenai evakuasi dan tempat tujuan.',
      'Jangan gunakan rute atau titik evakuasi contoh pada aplikasi ini.',
      'Periksa anggota keluarga tanpa memasuki area berbahaya.'
    ]
  },
  gempa: {
    immediate_actions: [
      { title: 'Saat guncangan berlangsung, lindungi diri', desc: 'Jika berada di dalam ruangan, merunduk, berlindung di bawah meja kokoh, dan berpegangan; jauhi kaca.', critical: true },
      { title: 'Setelah guncangan berhenti, waspadai bahaya sekitar', desc: 'Jangan memasuki bangunan yang rusak. Bergerak ke area terbuka hanya jika jalurnya aman.', critical: true },
      { title: 'Ikuti informasi resmi', desc: 'Pantau instruksi petugas dan informasi resmi mengenai gempa susulan.', critical: true }
    ],
    next_steps: [
      'Jangan kembali ke bangunan yang rusak sebelum dinyatakan aman oleh pihak berwenang.',
      'Periksa kondisi keluarga tanpa memasuki area berbahaya.',
      'Gunakan kanal darurat resmi setempat jika ada korban atau ancaman langsung.'
    ]
  },
  kebakaran: {
    immediate_actions: [
      { title: 'Menjauh dari api dan asap jika jalur keluar aman', desc: 'Jangan mengambil barang atau kembali ke bangunan yang terbakar.', critical: true },
      { title: 'Jika terhalang asap, tetap serendah mungkin', desc: 'Asap dapat mengganggu pernapasan dan jarak pandang; jangan membuka pintu yang terasa panas.', critical: true },
      { title: 'Hubungi layanan pemadam setempat', desc: 'Berikan lokasi kebakaran melalui kanal resmi yang tersedia di daerah Anda.', critical: true }
    ],
    next_steps: [
      'Jangan kembali ke lokasi kebakaran sampai petugas menyatakan aman.',
      'Jauhi bangunan dan akses yang sedang digunakan petugas.',
      'Beri tahu petugas jika ada orang yang belum ditemukan.'
    ]
  },
  longsor: {
    immediate_actions: [
      { title: 'Jauhi lereng dan jalur material longsor', desc: 'Jangan mendekati atau melintasi area longsor untuk melihat atau menolong tanpa arahan petugas.', critical: true },
      { title: 'Pindah dari area ancaman hanya jika jalurnya aman', desc: 'Ikuti arah evakuasi yang ditetapkan petugas; aplikasi ini tidak memiliki peta bahaya atau rute terverifikasi.', critical: true },
      { title: 'Hubungi petugas jika ada orang terdampak', desc: 'Sampaikan lokasi dan kebutuhan melalui kanal darurat resmi setempat.', critical: true }
    ],
    next_steps: [
      'Jauhi lereng yang menunjukkan perubahan atau pergerakan dan ikuti instruksi petugas.',
      'Jangan kembali ke area terdampak sebelum dinyatakan aman.',
      'Jangan gunakan rute atau titik evakuasi contoh pada aplikasi ini.'
    ]
  },
  erupsi: {
    immediate_actions: [
      { title: 'Ikuti perintah evakuasi dan zona bahaya resmi', desc: 'Aplikasi ini tidak memantau aktivitas gunung, arah sebaran, atau zona bahaya terkini.', critical: true },
      { title: 'Jangan mendekati kawah atau aliran material', desc: 'Gunakan hanya jalur evakuasi yang ditetapkan petugas dan jangan menerobos zona terlarang.', critical: true },
      { title: 'Hubungi petugas jika terancam atau membutuhkan bantuan', desc: 'Sampaikan lokasi melalui kanal resmi setempat.', critical: true }
    ],
    next_steps: [
      'Pantau informasi resmi dari otoritas kebencanaan dan petugas setempat.',
      'Jangan kembali ke zona terdampak sebelum ada izin resmi.',
      'Jangan gunakan rute atau titik evakuasi contoh pada aplikasi ini.'
    ]
  },
  lainnya: {
    immediate_actions: [
      { title: 'Jauhi bahaya langsung jika ada jalur yang jelas aman', desc: 'Aplikasi tidak dapat mengidentifikasi ancaman spesifik dari laporan ini.', critical: true },
      { title: 'Jangan mengikuti rute atau instruksi lokasi yang belum diverifikasi', desc: 'Kondisi lapangan dan tujuan aman tidak diketahui oleh aplikasi.', critical: true },
      { title: 'Hubungi petugas atau layanan darurat resmi setempat', desc: 'Jelaskan jenis ancaman, lokasi, dan kebutuhan bantuan.', critical: true }
    ],
    next_steps: [
      'Ikuti instruksi petugas di lokasi.',
      'Berikan informasi yang belum diketahui kepada petugas, bukan asumsi.',
      'Periksa anggota keluarga hanya jika aman dilakukan.'
    ]
  }
};

const hazardLabels = {
  banjir: 'banjir',
  gempa: 'gempa bumi',
  kebakaran: 'kebakaran',
  longsor: 'tanah longsor',
  erupsi: 'erupsi gunung api',
  lainnya: 'situasi darurat lainnya'
};

export function createSituationAssessment({ hazardType, location, userDescription }) {
  const guidance = guidanceByHazard[hazardType] || guidanceByHazard.lainnya;
  const hazardLabel = hazardLabels[hazardType] || hazardLabels.lainnya;
  const displayLocation = location?.trim() || 'lokasi belum disebutkan';

  return {
    situation_summary: `Anda memilih jenis kejadian ${hazardLabel} di ${displayLocation}. Deskripsi di bawah adalah laporan Anda dan belum diverifikasi oleh aplikasi.`,
    urgency_level: 'Panduan umum · urgensi belum dapat diverifikasi',
    reported_information: [userDescription.trim()],
    known_conditions: [`Jenis kejadian yang dipilih: ${hazardLabel}.`],
    missing_information: [
      'Kondisi, tingkat bahaya, dan lokasi aman aktual belum diverifikasi.',
      'Peringatan resmi dan kondisi rute tidak tersedia di aplikasi.'
    ],
    immediate_actions: guidance.immediate_actions,
    next_steps: guidance.next_steps,
    confidence_limitation: 'Ini adalah panduan skenario statis, bukan analisis AI. Aplikasi tidak memverifikasi laporan, kondisi lapangan, tingkat urgensi, sumber resmi, atau rute.',
    source_and_freshness: 'Tidak terhubung dengan feed peringatan atau sumber operasional resmi.',
    escalation: 'Jika ada ancaman langsung, gunakan kanal layanan darurat resmi yang tersedia di wilayah Anda dan ikuti arahan petugas.'
  };
}
