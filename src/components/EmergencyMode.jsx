'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Users, 
  PhoneCall, 
  AlertCircle,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronDown,
  LogOut,
  Sparkles,
  Radio,
  MessageSquare,
  CheckCircle2,
  Navigation,
  Flame,
  Waves,
  Activity,
  Mountain,
  AlertTriangle,
  Clock,
  Sun,
  Pause,
  Play
} from 'lucide-react';
import SignalBeaconModal from './SignalBeaconModal';
import FallbackSosModal from './FallbackSosModal';
import { speakIndonesian, stopSpeaking } from '../lib/speechVoice.js';

export default function EmergencyMode({ 
  hazardData, 
  onExitEmergencyMode, 
  onNavigateScreen, 
  onDoneStep 
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showFallback, setShowFallback] = useState(false);
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);
  const [isFallbackSosOpen, setIsFallbackSosOpen] = useState(false);
  const [isFlashlightOpen, setIsFlashlightOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [checkedSubtasks, setCheckedSubtasks] = useState({});

  // Golden Time Countdown Timer (15 minutes default)
  const [timerSeconds, setTimerSeconds] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const stepsByHazard = {
    banjir: [
      {
        id: 'b1',
        title: 'Putuskan Aliran Listrik & Amankan Stopkontak',
        instruction: 'Segera matikan sakelar meteran MCB listrik utama rumah sebelum air menggenang lebih tinggi. Kenakan alas kaki tertutup tebal (sepatu bot / kets) untuk menghindari sengatan arus listrik atau serpihan tajam.',
        subtasks: [
          'Matikan sakelar meteran MCB utama rumah',
          'Cabut steker peralatan listrik yang berada dekat lantai',
          'Kenakan sepatu karet / alas kaki tertutup tebal'
        ],
        why: 'Sengatan arus listrik dalam genangan air banjir yang keruh adalah penyebab fatalitas tertinggi pada fase awal genangan.',
        fallback: 'Bila meteran MCB sudah terendam air, JANGAN DISENTUH! Segera keluar rumah dan jauhi tiang listrik yang terendam.'
      },
      {
        id: 'b2',
        title: 'Amankan Dokumen & Siapkan Tas Siaga Bencana (TSB)',
        instruction: 'Bawa kantong kedap air berisi surat berharga (KTP, KK, sertifikat), obat-obatan rutin pribadi, senter, dan powerbank. Utamakan keselamatan lansia dan balita.',
        subtasks: [
          'Amankan dokumen penting dalam kantong plastik kedap air',
          'Bawa persediaan obat-obatan esensial keluarga',
          'Pastikan balita dan lansia mengenakan pakaian hangat / jaket pelampung'
        ],
        why: 'Kehilangan dokumen medis dan kedinginan (hipotermia) merupakan komplikasi paling berbahaya saat berada di penampungan darurat.',
        fallback: 'Bila air naik sangat cepat, tinggalkan barang bawaan berat! Keselamatan jiwa Anda dan keluarga jauh lebih utama.'
      },
      {
        id: 'b3',
        title: 'Evakuasi ke Dataran Tinggi (Hindari Underpass/Gorong-gorong)',
        instruction: 'Bergerak menyusuri rute aspal yang tinggi dan jauhi saluran drainase terbuka. Jangan menyeberang arus banjir jika ketinggian melebihi lutut. Gunakan tongkat kayu untuk menguji kedalaman jalan.',
        subtasks: [
          'Ikuti rute jalan tinggi yang terhindar dari luapan sungai',
          'Gunakan tongkat kayu / payung untuk meraba lubang selokan',
          'Hindari melintasi jembatan sempit dengan arus air deras di bawahnya'
        ],
        why: 'Arus banjir setinggi 15 cm saja sudah mampu menjatuhkan orang dewasa; saluran drainase yang hilang penutupnya adalah jebakan mematikan.',
        fallback: 'Jika arus di depan terlalu deras untuk diseberangi, naiklah ke lantai dua atau atap rumah dan bunyikan peluit darurat 3.000 Hz.'
      },
      {
        id: 'b4',
        title: 'Tiba di Posko Pengungsian & Lapor Meja Registrasi SAR',
        instruction: 'Masuk ke posko evakuasi yang ditunjuk aparat (balai RW/sekolah), daftarkan seluruh anggota keluarga ke meja absensi posko, dan periksa kebutuhan medis mendesak.',
        subtasks: [
          'Lapor kedatangan dan jumlah anggota ke meja registrasi relawan',
          'Dapatkan kartu bantuan logistik dan nomor tenda keluarga',
          'Periksa kondisi kesehatan anggota keluarga di pos medis darurat'
        ],
        why: 'Pendataan yang tertib di posko memastikan distribusi makanan, selimut, dan obat-obatan tepat sasaran untuk setiap keluarga.',
        fallback: 'Bila posko utama penuh, tanyakan posko sekunder terdekat kepada relawan SAR yang bertugas.'
      }
    ],
    gempa: [
      {
        id: 'g1',
        title: 'Drop, Cover, and Hold On (Merunduk, Berlindung, Bertahan)',
        instruction: 'Saat gempa berlangsung, segera merunduk ke lantai, lindungi kepala di bawah meja kokoh, dan berpegangan erat pada kaki meja. Jauhi jendela kaca, cermin, dan lemari yang berpotensi roboh.',
        subtasks: [
          'Merunduk ke bawah meja kokoh dan pegang erat kakinya',
          'Lindungi kepala dan tengkuk leher dengan lengan / bantal',
          'Jauhi jendela kaca, partisi dinding tipis, dan lampu gantung'
        ],
        why: 'Mayoritas cedera fatal pada gempa bumi diakibatkan oleh serpihan kaca dan plafon yang jatuh, bukan rubuhnya gedung secara total.',
        fallback: 'Bila tidak ada meja pelindung di dekat Anda, segera merapat dan meringkuk di sudut dinding dalam ruangan sambil menutupi kepala.'
      },
      {
        id: 'g2',
        title: 'Matikan Regulator Gas & Sakelar MCB Utama Rumah',
        instruction: 'Setelah guncangan utama berhenti, segera cabut regulator tabung gas elpiji dan matikan sakelar MCB listrik. Jangan menyalakan korek api atau sakelar lampu ruangan karena gas yang bocor dapat meledak.',
        subtasks: [
          'Cabut regulator tabung gas elpiji di dapur',
          'Matikan sakelar MCB listrik utama rumah',
          'Gunakan senter baterai / lampu HP, jangan pakai korek api'
        ],
        why: 'Percikan api listrik atau korek sekecil apa pun dapat memicu ledakan sekunder jika ada pipa gas yang retak pasca-gempa.',
        fallback: 'Bila tercium bau gas belerang yang menyengat, buka pintu selebar-lebarnya dan langsung evakuasi keluar ruangan tanpa menyentuh sakelar.'
      },
      {
        id: 'g3',
        title: 'Buka Pintu Akses Keluar & Waspadai Reruntuhan Genteng',
        instruction: 'Buka kunci dan ganjal pintu keluar agar kusen pintu tidak macet akibat deformasi dinding saat gempa susulan. Kenakan helm atau tutupi kepala saat keluar ruangan.',
        subtasks: [
          'Buka dan ganjal pintu keluar rumah agar tidak terkunci macet',
          'Lindungi kepala dengan tas / helm saat melintasi pintu keluar',
          'Gunakan tangga darurat secara tertib (dilarang naik lift)'
        ],
        why: 'Kusen pintu yang terjepit oleh pergeseran dinding dapat mengunci penghuni di dalam ruangan saat gempa susulan datang.',
        fallback: 'Bila pintu utama macet, gunakan jendela lantai satu yang aman untuk keluar menuju pekarangan.'
      },
      {
        id: 'g4',
        title: 'Evakuasi Tertib ke Lapangan Terbuka Jauh dari Tiang Kabel',
        instruction: 'Bergerak ke tanah lapang terbuka yang bebas dari gedung tinggi, tiang listrik, dan pohon besar. Pantau peringatan tsunami resmi jika berada di wilayah pesisir.',
        subtasks: [
          'Berkumpul di lapangan terbuka / titik kumpul RT/RW',
          'Jauhi dinding pembatas bata dan baliho reklame',
          'Periksa kelengkapan seluruh anggota keluarga'
        ],
        why: 'Gempa susulan (aftershock) berpotensi merobohkan struktur bangunan yang telah retak atau melemah pada guncangan awal.',
        fallback: 'Bila Anda terjebak di dalam reruntuhan bangunan, hemat energi; jangan berteriak terus-menerus. Ketukkan benda keras atau bunyikan peluit SOS.'
      }
    ],
    kebakaran: [
      {
        id: 'k1',
        title: 'Merangkak Rendah & Tutup Saluran Napas dengan Kain Basah',
        instruction: 'Segera merangkak di lantai karena udara bersih berada pada ketinggian 30-60 cm dari lantai. Tutup hidung dan mulut menggunakan kain atau masker yang dibasahi air.',
        subtasks: [
          'Merangkak rendah di bawah lapisan asap tebal',
          'Tutup hidung dan mulut dengan kain basah / masker',
          'Tinggalkan semua barang berharga, utamakan keluar segera'
        ],
        why: 'Menghirup gas karbon monoksida dan asap beracun dapat menyebabkan pingsan dan kerusakan paru-paru hanya dalam 2-3 tarikan napas.',
        fallback: 'Bila terperangkap asap pekat, sumbat celah bawah pintu dengan kain basah dan dekati jendela untuk melambaikan kain terang minta bantuan.'
      },
      {
        id: 'k2',
        title: 'Raba Daun Pintu dengan Punggung Tangan Sebelum Membuka',
        instruction: 'Sebelum membuka pintu ruangan keluar, tempelkan punggung tangan pada gagang dan daun pintu. Bila terasa hangat atau panas, JANGAN BUKA! Api berada tepat di baliknya.',
        subtasks: [
          'Sentuh daun dan gagang pintu dengan punggung tangan',
          'Bila panas, cari jendela atau jalur ventilasi alternatif',
          'Bila dingin, buka sedikit secara perlahan sambil melindungi wajah'
        ],
        why: 'Membuka pintu ke ruangan yang panas dapat memicu ledakan aliran udara (backdraft) yang menyemburkan lidah api besar seketika.',
        fallback: 'Jika pintu keluar utama terhalang api, larilah ke balkon atau ruangan yang memiliki jendela menghadap luar untuk dievakuasi pemadam.'
      },
      {
        id: 'k3',
        title: 'Tutup Rapat Celah Pintu Jika Terjebak & Beri Isyarat di Jendela',
        instruction: 'Jika jalur keluar terhalang kobaran api, masuki ruangan dengan jendela keluar, tutup pintu rapat-rapat, basahi handuk/baju untuk menyumbat ventilasi, dan lambaikan kain terang ke arah jalan.',
        subtasks: [
          'Masuki ruangan terluar yang memiliki jendela ke area jalan',
          'Sumbat celah bawah pintu menggunakan handuk basah',
          'Buka jendela sedikit untuk bernapas dan lambaikan kain warna terang'
        ],
        why: 'Menghalangi suplai asap masuk ke ruangan memperpanjang waktu bertahan hingga tim pemadam kebakaran tiba mengevakuasi.',
        fallback: 'Bila pakaian Anda terbakar: Berhenti, Jatuhkan Diri ke tanah, dan Bergulinglah (Stop, Drop, and Roll) hingga api padam.'
      },
      {
        id: 'k4',
        title: 'Keluar ke Titik Kumpul Aman & Hubungi Damkar (113)',
        instruction: 'Segera menuju titik kumpul warga di luar pekarangan. Jangan pernah masuk kembali ke dalam gedung yang terbakar dengan alasan apa pun. Hubungi petugas Damkar di nomor 113.',
        subtasks: [
          'Menuju titik kumpul warga di ruang terbuka yang aman',
          'Periksa kelengkapan seluruh anggota keluarga',
          'Telepon Damkar (113) dan laporkan bila ada orang tertinggal di dalam'
        ],
        why: 'Kebakaran menyebar secara eksponensial dalam hitungan detik; masuk kembali ke gedung yang terbakar memiliki risiko fatalitas tertinggi.',
        fallback: 'Gunakan nomor darurat terpadu 112 jika nomor lokal pemadam kebakaran sedang sibuk.'
      }
    ],
    longsor: [
      {
        id: 'l1',
        title: 'Evakuasi Menyamping (Tegak Lurus Arah Luncuran Tebing)',
        instruction: 'Segera evakuasi secara lateral (menyamping tegak lurus dari arah jatuhnya material longsor). Jangan pernah berlari lurus menuruni lembah searah jatuhnya tanah dan bebatuan.',
        subtasks: [
          'Lari menyamping menjauhi arah runtuhan material lereng',
          'Hindari lembah, alur sungai, dan jalur cekungan tanah',
          'Peringatkan tetangga sekitar yang berada di bawah lereng'
        ],
        why: 'Material longsoran tanah basah bergerak dengan kecepatan puluhan kilometer per jam dan menyapu bersih seluruh dasar lembah.',
        fallback: 'Jika tidak sempat melarikan diri, segera meringkuk seperti bola di balik pohon kokoh atau batuan besar sambil melindungi kepala.'
      },
      {
        id: 'l2',
        title: 'Waspadai Aliran Sungai yang Mendadak Surut & Tiang Miring',
        instruction: 'Jauhi aliran air sungai yang mendadak keruh kecokelatan atau air yang tiba-tiba surut drastis. Perhatikan pohon dan tiang listrik yang mulai miring.',
        subtasks: [
          'Jauhi sungai yang airnya mendadak surut atau sangat keruh',
          'Hindari tiang listrik miring dan kabel yang menjuntai di tanah',
          'Dengarkan suara gemuruh retakan tanah baru'
        ],
        why: 'Sungai yang mendadak surut menandakan terbentuknya bendung alami longsor di hulu yang dapat jebol sewaktu-waktu (banjir bandang).',
        fallback: 'Bertahanlah di tempat yang datar, keras, dan tinggi jauh dari bibir tebing tanah.'
      },
      {
        id: 'l3',
        title: 'Menjauh dari Lembah Cekungan ke Tanah Datar Kokoh',
        instruction: 'Berjalan melalui jalan beraspal padat menuju balai desa atau posko evakuasi yang ditentukan aparat SAR. Jangan kembali ke lereng sebelum dinyatakan stabil oleh PVMBG.',
        subtasks: [
          'Evakuasi ke zona datar yang jauh dari potensi runtuhan susulan',
          'Pastikan tidak melintasi jembatan darurat yang tergerus air',
          'Bantu lansia dan balita melintasi jalan licin berlumpur'
        ],
        why: 'Tanah longsor sering diikuti oleh longsoran susulan saat hujan berikutnya turun.',
        fallback: 'Bila jalan raya terputus oleh timbunan tanah, tunggu tim evakuasi Basarnas dan jangan mencoba menerobos timbunan tanah labil.'
      },
      {
        id: 'l4',
        title: 'Tuju Balai Desa / Posko Aman yang Ditentukan Petugas',
        instruction: 'Tiba di posko penampungan resmi, daftarkan anggota keluarga, dan pastikan tidak ada keluarga yang tertinggal di area bahaya.',
        subtasks: [
          'Daftarkan anggota keluarga ke petugas posko',
          'Laporkan jika mengetahui tetangga yang masih tertimbun',
          'Tunggu evaluasi kestabilan lereng sebelum menengok rumah'
        ],
        why: 'Pendataan terpusat mempermudah pemetaan korban yang masih memerlukan operasi pencarian oleh Basarnas.',
        fallback: 'Bila sinyal ponsel terputus, gunakan radio HT warga atau kurir lisan untuk mengabari posko terdekat.'
      }
    ],
    erupsi: [
      {
        id: 'e1',
        title: 'Kenakan Masker N95 & Kacamata Pelindung Debu Silika',
        instruction: 'Segera tutup hidung dan mulut dengan masker medis berlapis atau masker N95 untuk menyaring debu silika vulkanik. Gunakan kacamata pelindung (bukan lensa kontak) dan pakaian berlengan panjang.',
        subtasks: [
          'Gunakan masker N95 / kain basah penutup pernapasan',
          'Lepas lensa kontak dan kenakan kacamata pelindung',
          'Pakai jaket lengan panjang dan celana tebal'
        ],
        why: 'Abu vulkanik terdiri dari partikel silika kaca tajam mikroskopis yang merusak alveolus paru-paru dan menggores kornea mata.',
        fallback: 'Jika tidak memiliki masker khusus, gunakan kain tebal atau kaus yang dibasahi air hangat untuk menutup mulut dan hidung.'
      },
      {
        id: 'e2',
        title: 'Tutup Ventilasi Rumah & Amankan Cadangan Air Minum Tertutup',
        instruction: 'Tutup rapat semua jendela, pintu, dan saluran ventilasi rumah. Simpan pasokan air minum dalam wadah tertutup rapat agar tidak terpapar abu beracun.',
        subtasks: [
          'Tutup semua ventilasi menggunakan kain atau lakban',
          'Amankan wadah penampungan air minum keluarga',
          'Matikan pendingin ruangan (AC) dan kipas angin'
        ],
        why: 'Abu vulkanik mengandung senyawa sulfur dan fluorida yang dapat mencemari air minum dan menyebabkan keracunan.',
        fallback: 'Gunakan air mineral botol bersegel untuk kebutuhan minum seluruh keluarga.'
      },
      {
        id: 'e3',
        title: 'Jauhi Aliran Sungai Lahar Dingin & Lembah Alur Kawah',
        instruction: 'Jauhi bantaran sungai yang berhulu di puncak gunung. Bergerak ke luar dari radius Kawasan Rawan Bencana (KRB) yang ditetapkan BMKG & PVMBG.',
        subtasks: [
          'Evakuasi tegak lurus menjauhi aliran sungai lahar hujan',
          'Jangan mengemudi kendaraan saat hujan abu pekat turun',
          'Patuhi batas radius bahaya yang ditetapkan pos pengamatan'
        ],
        why: 'Lahar dingin dan awan panas meluncur di sepanjang alur sungai dengan kecepatan tinggi dan suhu ratusan derajat Celsius.',
        fallback: 'Bila terperangkap hujan abu lebat, berlindunglah di gedung beratap kokoh dan bersihkan akumulasi abu atap secara berkala agar tidak runtuh.'
      },
      {
        id: 'e4',
        title: 'Evakuasi Mengikuti Konvoi Aparat Keluar dari Radius KRB',
        instruction: 'Ikuti konvoi evakuasi terkoordinasi menuju posko pengungsian di luar lingkar KRB 3. Laporkan kondisi kesehatan anggota keluarga yang mengalami sesak napas.',
        subtasks: [
          'Kumpul di titik evakuasi resmi yang dipandu aparat',
          'Lapor segera jika ada anggota keluarga dengan riwayat asma',
          'Minum air dari wadah tertutup yang tidak terkontaminasi abu'
        ],
        why: 'Gas sulfur dioksida (SO2) berbahaya yang menyertai erupsi dapat memicu gagal napas akut pada penderita asma.',
        fallback: 'Gunakan radio komunikasi atau SMS beacon jika jaringan sinyal seluler terganggu oleh ionisasi awan abu vulkanik.'
      }
    ],
    lainnya: [
      {
        id: 'x1',
        title: 'Jauhi Bahaya Fisik Langsung & Amankan Posisi Diri',
        instruction: 'Segera pindah dari posisi berbahaya ke lokasi terbuka yang aman. Perhatikan kondisi sekitar dan jangan mengambil risiko yang tidak perlu.',
        subtasks: [
          'Amati arah ancaman dan bergerak menjauh ke titik aman',
          'Pastikan anggota keluarga tetap dalam satu kelompok',
          'Lindungi diri dari potensi bahaya fisik sekitar'
        ],
        why: 'Mengamankan diri terlebih dahulu adalah syarat mutlak sebelum dapat membantu anggota keluarga lain secara efektif.',
        fallback: 'Bila tidak tahu arah aman, diam di tempat yang terlindung dan tunggu instruksi dari petugas berwenang.'
      },
      {
        id: 'x2',
        title: 'Lindungi Anggota Keluarga Rentan (Balita & Lansia)',
        instruction: 'Pastikan anak-anak, lansia, atau anggota keluarga yang sakit berada dalam perlindungan orang dewasa. Bawa perbekalan vital darurat.',
        subtasks: [
          'Bawa obat-obatan rutin dan susu formula balita',
          'Bantu mobilitas lansia atau anggota yang cedera',
          'Gunakan pakaian pelindung yang nyaman dan hangat'
        ],
        why: 'Kelompok rentan memiliki ketahanan fisik terbatas di tengah kondisi krisis.',
        fallback: 'Minta bantuan warga sekitar atau tetangga untuk membantu menggendong balita atau menuntun lansia.'
      },
      {
        id: 'x3',
        title: 'Hubungi Layanan Darurat 112 / 115 Berikan Titik Lokasi',
        instruction: 'Sampaikan jenis ancaman, perkiraan jumlah korban, dan alamat spesifik ke layanan darurat terpadu 112 atau Basarnas 115.',
        subtasks: [
          'Hubungi layanan darurat 112 / aparat terdekat',
          'Sampaikan lokasi tepat dan kebutuhan medis mendesak',
          'Jaga daya baterai ponsel untuk komunikasi penyelamatan'
        ],
        why: 'Penanganan cepat oleh tenaga profesional memperbesar peluang keselamatan secara signifikan.',
        fallback: 'Jika ponsel tidak ada sinyal, minta tolong warga sekitar untuk meneruskan laporan ke posko terdekat.'
      },
      {
        id: 'x4',
        title: 'Menuju Fasilitas Publik Terdekat yang Dijadikan Posko Darurat',
        instruction: 'Berjalan menuju fasilitas umum terdekat (balai RW, masjid, sekolah) yang difungsikan sebagai posko aman dan catat nama keluarga.',
        subtasks: [
          'Tuju posko evakuasi yang ditunjuk aparat',
          'Daftarkan seluruh nama anggota keluarga di meja absensi',
          'Dapatkan kartu identitas bantuan darurat'
        ],
        why: 'Pendataan yang tertib di posko memastikan distribusi makanan, obat, dan selimut tepat sasaran.',
        fallback: 'Jika belum ada posko resmi, berkumpullah bersama warga lain di tempat yang terang dan memiliki akses jalan terbuka.'
      }
    ]
  };

  const currentHazardSteps = stepsByHazard[hazardData?.type] || stepsByHazard.lainnya;
  const currentStep = currentHazardSteps[currentStepIndex] || currentHazardSteps[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === currentHazardSteps.length - 1;

  // Subtask progress calculation for current step
  const currentSubtasks = currentStep.subtasks || [];
  const completedSubtasksCount = currentSubtasks.filter(
    task => Boolean(checkedSubtasks[`${currentStep.id}-${task}`])
  ).length;
  const isAllSubtasksDone = currentSubtasks.length > 0 && completedSubtasksCount === currentSubtasks.length;

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleNextStep = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setShowFallback(false);
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      if (onDoneStep) onDoneStep();
      onNavigateScreen('confirm_safe');
    }
  };

  const handlePrevStep = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setShowFallback(false);
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleJumpToStep = (index) => {
    stopSpeaking();
    setIsSpeaking(false);
    setShowFallback(false);
    setCurrentStepIndex(index);
  };

  const toggleVoiceGuidance = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const subtasksText = currentSubtasks.length > 0
        ? `Lakukan tindakan berikut: ${currentSubtasks.join('. ')}.`
        : '';
      const textToSpeak = `${currentStep.title}. ${currentStep.instruction}. ${subtasksText} Alasan keselamatan: ${currentStep.why}`;
      speakIndonesian(textToSpeak, {
        rate: 0.92,
        onstart: () => setIsSpeaking(true),
        onend: () => setIsSpeaking(false),
        onerror: () => setIsSpeaking(false)
      });
    }
  };

  const toggleSubtask = (subtaskText) => {
    const key = `${currentStep.id}-${subtaskText}`;
    setCheckedSubtasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getHazardBadge = () => {
    switch (hazardData?.type) {
      case 'gempa': return { label: 'Gempa Bumi', icon: Activity, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'kebakaran': return { label: 'Kebakaran', icon: Flame, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'longsor': return { label: 'Tanah Longsor', icon: Mountain, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'erupsi': return { label: 'Erupsi Gunung', icon: AlertTriangle, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default: return { label: 'Banjir', icon: Waves, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
  };

  const hazardBadge = getHazardBadge();
  const HazardIcon = hazardBadge.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn pb-16">
      
      {/* 1. CLEAN LIGHT HEADER (No Dark Background) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                SIAGA 1 AKTIF
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${hazardBadge.color}`}>
                <HazardIcon className="w-3.5 h-3.5" />
                {hazardBadge.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 tracking-tight">
              Panduan Tindakan Lapangan
            </h1>
          </div>
        </div>

        {/* Header Quick Tools */}
        <div className="flex items-center gap-2">
          {/* Subtle Flashlight toggle */}
          <button
            type="button"
            onClick={() => setIsFlashlightOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl border border-amber-200 transition-all cursor-pointer"
            title="Nyalakan senter layar terang"
          >
            <Sun className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Senter Layar</span>
          </button>

          {/* Golden Time Countdown Widget */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{formatTimer(timerSeconds)}</span>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-blue-700 hover:text-blue-900 ml-0.5 cursor-pointer"
              title={isTimerRunning ? 'Jeda' : 'Lanjut'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>

          <button
            type="button"
            onClick={onExitEmergencyMode}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
            title="Kembali ke Beranda"
          >
            <LogOut className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* 2. PROGRESS BAR & STEP INDICATOR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-800">
            Langkah {currentStepIndex + 1} dari {currentHazardSteps.length}
          </span>
          <span className="font-bold text-blue-700 truncate max-w-xs">
            {currentStep.title}
          </span>
        </div>

        {/* Lightweight Clickable Step Track */}
        <div className="grid grid-cols-4 gap-2">
          {currentHazardSteps.map((s, idx) => {
            const isDone = completedSteps.includes(s.id);
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleJumpToStep(idx)}
                className={`py-1.5 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  <span className="text-[11px] font-black">Langkah {idx + 1}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRIMARY ACTION STEP CARD */}
      <div className="bg-white rounded-3xl border-2 border-blue-500/80 shadow-md p-6 sm:p-7 space-y-5">
        
        {/* Step Header with TTS Voice */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-xs font-black tracking-wide">
            INSTRUKSI UTAMA
          </span>

          <button
            type="button"
            onClick={toggleVoiceGuidance}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
            title="Dengarkan instruksi suara"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isSpeaking ? 'Hentikan Suara' : 'Dengarkan Instruksi'}</span>
          </button>
        </div>

        {/* Step Title & Instruction */}
        <div className="space-y-2.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
            {currentStep.title}
          </h2>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-sm leading-relaxed font-semibold">
            {currentStep.instruction}
          </div>
        </div>

        {/* Checklist Sub-Tindakan */}
        {currentSubtasks.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700">
                Checklist Tindakan ({completedSubtasksCount}/{currentSubtasks.length} Selesai):
              </span>
              {isAllSubtasksDone && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Selesai
                </span>
              )}
            </div>

            <div className="space-y-2">
              {currentSubtasks.map((task, i) => {
                const isChecked = Boolean(checkedSubtasks[`${currentStep.id}-${task}`]);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleSubtask(task)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs sm:text-sm ${isChecked ? 'line-through text-slate-400 font-normal' : 'font-semibold'}`}>
                      {task}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Safety Rationale (Light Blue) */}
        <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-xs text-blue-950 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mengapa ini penting:</strong> {currentStep.why}
          </p>
        </div>

        {/* Fallback Accordion (Discreet text toggle, not a giant button) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFallback(!showFallback)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer py-1"
          >
            <span>Terkendala melakukan langkah ini? Lihat panduan cadangan</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFallback ? 'rotate-180' : ''}`} />
          </button>

          {showFallback && (
            <div className="mt-2 p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-amber-950 text-xs sm:text-sm font-semibold leading-relaxed animate-fadeIn">
              <strong>Jalur Alternatif:</strong> {currentStep.fallback}
            </div>
          )}
        </div>

        {/* Primary Navigation Actions */}
        <div className="pt-2 flex items-center gap-3">
          {!isFirstStep && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm sm:text-base shadow-md shadow-blue-600/25 hover:shadow-lg transition-all cursor-pointer active:scale-98"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>
              {isLastStep 
                ? 'Selesai — Konfirmasi Tiba di Posko' 
                : 'Selesai, Lanjut ke Langkah Berikutnya'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. COMPACT SECONDARY TOOLS (Light & Clean Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setIsBeaconOpen(true)}
          className="p-3 bg-white hover:bg-rose-50/50 rounded-2xl border border-slate-200 hover:border-rose-300 shadow-2xs flex flex-col items-start gap-1.5 text-left transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-xs text-slate-900">Peluit SOS</p>
            <p className="text-[10px] text-slate-500">Bunyi 3.000 Hz</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsFallbackSosOpen(true)}
          className="p-3 bg-white hover:bg-amber-50/50 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-2xs flex flex-col items-start gap-1.5 text-left transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-xs text-slate-900">Kirim SMS</p>
            <p className="text-[10px] text-slate-500">Koordinat GPS</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateScreen('route')}
          className="p-3 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs flex flex-col items-start gap-1.5 text-left transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-xs text-slate-900">Peta Rute</p>
            <p className="text-[10px] text-slate-500">Arah ke Posko</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateScreen('family')}
          className="p-3 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs flex flex-col items-start gap-1.5 text-left transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="font-extrabold text-xs text-slate-900">Keluarga</p>
            <p className="text-[10px] text-slate-500">Status Check-in</p>
          </div>
        </button>
      </div>

      {/* 5. LIGHT EMERGENCY HOTLINE BAR (Clean & Bright, No Slate-900) */}
      <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-rose-900 font-bold">
          <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Panggilan Darurat:</span>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="tel:112"
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg transition-colors text-xs"
          >
            112 Darurat
          </a>
          <a 
            href="tel:115"
            className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 font-extrabold rounded-lg transition-colors text-xs"
          >
            115 Basarnas
          </a>
        </div>
      </div>

      {/* SCREEN FLASHLIGHT MODAL */}
      {isFlashlightOpen && (
        <div 
          onClick={() => setIsFlashlightOpen(false)}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center text-slate-900 p-6 text-center cursor-pointer animate-fadeIn"
        >
          <div className="space-y-4 max-w-sm">
            <div className="w-20 h-20 rounded-full bg-amber-400 mx-auto flex items-center justify-center shadow-2xl animate-pulse">
              <Sun className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black">Mode Senter Layar Aktif</h3>
            <p className="text-sm text-slate-600 font-semibold">
              Layar HP menyala dengan kecerahan maksimal untuk menerangi jalur evakuasi saat listrik padam.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsFlashlightOpen(false)}
                className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-md"
              >
                Ketuk Layar untuk Menutup Senter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <SignalBeaconModal 
        isOpen={isBeaconOpen} 
        onClose={() => setIsBeaconOpen(false)} 
      />

      <FallbackSosModal
        isOpen={isFallbackSosOpen}
        onClose={() => setIsFallbackSosOpen(false)}
        hazardType={hazardData?.type || 'darurat'}
        userLocation={hazardData?.location}
        userName={hazardData?.userName || 'Warga'}
      />
    </div>
  );
}
