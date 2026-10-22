import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  ArrowRight, 
  MapPin, 
  Users, 
  CheckSquare, 
  PhoneCall, 
  HelpCircle, 
  AlertCircle,
  Volume2,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function EmergencyMode({ 
  hazardData, 
  onExitEmergencyMode, 
  onNavigateScreen, 
  onDoneStep 
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [unableReason, setUnableReason] = useState(null);

  // High stress, distraction-free steps tailored to hazard
  const stepsByHazard = {
    banjir: [
      {
        id: 's1',
        title: 'Matikan Saklar Listrik Utama (MCB)',
        instruction: 'Cari box MCB di dinding rumah. Tarik tuas ke posisi OFF (Mati). Jangan sentuh jika tangan basah kuyup, gunakan gagang sapu kayu atau lap kering.',
        why: 'Mencegah sengatan listrik fatal di air tergenang.',
        fallback: 'Jika box MCB sudah terendam air, JANGAN DIDEKATI! Langsung keluar menjauh.'
      },
      {
        id: 's2',
        title: 'Bantu Lansia & Gendong Balita',
        instruction: 'Pastikan Ibu Ratna memakai sandal/sepatu tertutup dan dipapah. Pastikan anak balita digendong di pundak/dada agar aman dari arus.',
        why: 'Arus 20 cm dapat merobohkan orang dewasa dan balita.',
        fallback: 'Jika tidak sanggup memapah sendirian, teriak minta bantuan tetangga atau tiup peluit darurat.'
      },
      {
        id: 's3',
        title: 'Bawa Tas Siaga Darurat (P3K & Obat)',
        instruction: 'Raih tas ransel siaga yang berisi obat rutin Ibu Ratna dan dokumen kedap air. Jangan kembali mengambil perabot atau barang lain.',
        why: 'Kebutuhan medis lebih mendesak daripada barang materiel.',
        fallback: 'Jika tas tertinggal di area banjir dalam, TINGGALKAN! Nyawa keluarga nomor satu.'
      },
      {
        id: 's4',
        title: 'Bergerak ke Posko RW 04 Melalui Jalur Kering',
        instruction: 'Melangkah perlahan, gunakan tongkat untuk meraba lubang selokan. Ikuti rombongan warga menuju Balai Warga RW 04 (350 meter).',
        why: 'Posko RW 04 terverifikasi berstatus aman dan berdataran tinggi.',
        fallback: 'Jika jalan Mawar terendam lebih dari 1 meter, naik ke lantai 2 tetangga dan kibarkan kain penanda.'
      }
    ],
    gempa: [
      {
        id: 's1',
        title: 'Lindungi Kepala & Keluar ke Ruang Terbuka',
        instruction: 'Tutupi kepala dengan helm, bantal tebal, atau tas ransel. Berjalan cepat (jangan lari panik) menuju lapangan terbuka atau jalan lebar.',
        why: 'Puing atap dan genteng dapat runtuh saat terjadi gempa susulan.',
        fallback: 'Jika pintu macet terjepit kusen, berlindung di samping meja kokoh atau sudut pilar utama.'
      },
      {
        id: 's2',
        title: 'Jauhi Tiang Listrik & Kaca Jendela',
        instruction: 'Posisikan seluruh anggota keluarga di tengah tanah lapang. Pastikan jarak aman minimal sama dengan tinggi tiang listrik terdekat.',
        why: 'Kabel listrik tegangan tinggi rentan putus.',
        fallback: 'Jika di area sempit, lindungi diri di bawah kanopi beton bertulang permanen.'
      },
      {
        id: 's3',
        title: 'Hitung & Konfirmasi Jumlah Anggota',
        instruction: 'Pastikan semua orang yang ada di dalam rumah sudah berada di titik kumpul luar.',
        why: 'Memastikan tidak ada korban terperangkap di reruntuhan.',
        fallback: 'Jika ada yang tertinggal di dalam gedung rapuh, JANGAN masuk sendiri! Laporkan ke regu penyelamat.'
      }
    ],
    kebakaran: [
      {
        id: 's1',
        title: 'Merangkak Rendah Menjauhi Asap',
        instruction: 'Posisi hidung 30 cm di atas lantai. Tutup hidung dengan kain basah. Bernapaslah perlahan.',
        why: 'Asap panas dan karbon monoksida naik ke atas langit-langit.',
        fallback: 'Jika tidak ada kain basah, gunakan baju bagian dalam yang masih bersih.'
      },
      {
        id: 's2',
        title: 'Cek Suhu Gagang Pintu Sebelum Dibuka',
        instruction: 'Sentuh gagang pintu dengan punggung tangan Anda. Jika terasa panas, JANGAN BUKA pintu tersebut.',
        why: 'Pintu panas menandakan kobaran api besar tepat di baliknya.',
        fallback: 'Gunakan jendela darurat atau pintu belakang untuk jalan keluar alternatif.'
      },
      {
        id: 's3',
        title: 'Keluar dan Jangan Pernah Masuk Kembali',
        instruction: 'Setelah berada di luar pekarangan, segera menjauh searah datangnya angin.',
        why: 'Ledakan gas atau runtuhan atap dapat terjadi seketika.',
        fallback: 'Panggil pemadam di 113 dari ponsel tetangga jika ponsel tertinggal.'
      }
    ]
  };

  const currentHazardSteps = stepsByHazard[hazardData.type] || stepsByHazard.banjir;
  const currentStep = currentHazardSteps[currentStepIndex];
  const isLastStep = currentStepIndex === currentHazardSteps.length - 1;

  const handleNextStep = () => {
    setUnableReason(null);
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
    }
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Reached the end of guided actions, proceed to safe confirmation
      onNavigateScreen('confirm_safe');
    }
  };

  const handleUnable = () => {
    setUnableReason(currentStep.fallback);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* High Urgency Contrast Header (PRD 4.4 & 7.4) */}
      <div className="bg-[#0D47A1] text-white p-5 rounded-3xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <ShieldAlert className="w-6 h-6 text-[#90CAF9] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-rose-600 text-white rounded">
                EMERGENCY MODE AKTIF
              </span>
              <span className="text-xs text-blue-200">Mode Stres Rendah</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black mt-0.5">
              Panduan Tindakan 1-Langkah
            </h1>
          </div>
        </div>

        <button
          onClick={onExitEmergencyMode}
          className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Mode</span>
        </button>
      </div>

      {/* Big Step Progress Indicator */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider">
          Langkah {currentStepIndex + 1} dari {currentHazardSteps.length}
        </span>
        <div className="flex gap-1.5">
          {currentHazardSteps.map((_, i) => (
            <div 
              key={i}
              className={`h-2.5 rounded-full transition-all ${
                i === currentStepIndex 
                  ? 'w-8 bg-[#2196F3]' 
                  : i < currentStepIndex 
                    ? 'w-3 bg-emerald-500' 
                    : 'w-3 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* THE PRIMARY ACTION CARD (PRD 4.4: Satu tindakan utama per langkah, tombol besar) */}
      <div className="bg-white rounded-3xl border-3 border-[#2196F3] p-6 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E3F2FD] text-[#0D47A1] rounded-full text-xs font-extrabold tracking-wide">
            <span>TINDAKAN UTAMA ANDA SEKARANG</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            {currentStep.title}
          </h2>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-base sm:text-lg leading-relaxed font-medium">
            {currentStep.instruction}
          </div>
        </div>

        {/* Why this matters */}
        <div className="p-3.5 bg-[#E3F2FD]/60 rounded-xl border border-[#90CAF9] text-xs text-[#0D47A1] flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#2196F3] shrink-0" />
          <span><strong>Alasan Keselamatan:</strong> {currentStep.why}</span>
        </div>

        {/* Fallback Display if user clicked "Saya tidak bisa melakukan ini" */}
        {unableReason && (
          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-amber-950 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Instruksi Alternatif Cadangan:</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              {unableReason}
            </p>
          </div>
        )}

        {/* LARGE ACTION BUTTONS (PRD 4.4: "Selesai, Lanjut" & "Saya Tidak Bisa Melakukan Ini") */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full flex items-center justify-center gap-3 py-5 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-2xl font-extrabold text-lg sm:text-xl shadow-lg shadow-blue-900/30 hover:shadow-xl transition-all cursor-pointer transform active:scale-[0.99]"
          >
            <Check className="w-6 h-6 text-[#90CAF9]" />
            <span>{isLastStep ? 'Selesai — Konfirmasi Keberadaan Aman' : 'Selesai, Lanjut Langkah Berikutnya'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleUnable}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Saya tidak bisa melakukan langkah ini (Lihat Alternatif)</span>
          </button>
        </div>
      </div>

      {/* QUICK COMPANION SHORTCUTS during Emergency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigateScreen('family')}
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-[#2196F3] shadow-xs flex items-center gap-3 text-left transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-slate-800">Status Keluarga</p>
            <p className="text-[11px] text-slate-500">3 anggota terdata</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateScreen('route')}
          className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-[#2196F3] shadow-xs flex items-center gap-3 text-left transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-slate-800">Rute Evakuasi</p>
            <p className="text-[11px] text-slate-500">Posko RW 04 (350m)</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateScreen('safety_map')}
          className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 hover:border-rose-400 shadow-xs flex items-center gap-3 text-left transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-rose-900">Radar Warga (1 km)</p>
            <p className="text-[11px] text-rose-600 font-semibold">PIN SOS Aktif</p>
          </div>
        </button>
      </div>

      {/* Emergency Hotline Direct Bar */}
      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-900 font-semibold">
          <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Kondisi darurat makin parah? Hubungi tim SAR / Posko</span>
        </div>
        <a 
          href="tel:112"
          className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors"
        >
          Panggil 112
        </a>
      </div>
    </div>
  );
}
