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

  const stepsByHazard = {
    banjir: [
      {
        id: 's1',
        title: 'Jangan masuk atau menyeberangi air banjir',
        instruction: 'Arus, kedalaman, lubang, kabel, dan kontaminasi air tidak dapat dipastikan dari aplikasi.',
        why: 'Air banjir dapat menyembunyikan bahaya yang tidak terlihat.',
        fallback: 'Jika terjebak, hubungi layanan darurat resmi setempat dan sampaikan lokasi Anda.'
      },
      {
        id: 's2',
        title: 'Jauhi sumber listrik dan area tergenang',
        instruction: 'Jangan sentuh peralatan listrik atau panel yang basah atau terendam.',
        why: 'Aplikasi tidak dapat memastikan listrik di lokasi Anda aman.',
        fallback: 'Jaga jarak dari area basah dan minta arahan petugas setempat.'
      },
      {
        id: 's3',
        title: 'Hubungi petugas bila Anda atau keluarga terancam',
        instruction: 'Sampaikan lokasi, jumlah orang, dan kebutuhan melalui kanal darurat resmi setempat.',
        why: 'Laporan lewat aplikasi ini tidak mengirim petugas.',
        fallback: 'Jika panggilan tidak tersambung, coba kanal resmi lain di wilayah Anda atau minta bantuan langsung bila aman.'
      }
    ],
    gempa: [
      {
        id: 's1',
        title: 'Saat guncangan, lindungi diri di tempat',
        instruction: 'Jika berada di dalam ruangan, merunduk, berlindung di bawah meja kokoh, dan berpegangan; jauhi kaca.',
        why: 'Keluar saat guncangan dapat meningkatkan risiko terkena benda jatuh.',
        fallback: 'Jika tidak ada meja, lindungi kepala dan leher, lalu jauhi kaca jika dapat dilakukan.'
      },
      {
        id: 's2',
        title: 'Setelah guncangan berhenti, periksa bahaya sekitar',
        instruction: 'Jangan memasuki bangunan yang rusak. Bergerak ke area terbuka hanya jika jalurnya aman.',
        why: 'Aplikasi tidak dapat menilai kondisi struktur atau keamanan rute.',
        fallback: 'Jauhi bagian bangunan yang rusak dan ikuti arahan petugas.'
      },
      {
        id: 's3',
        title: 'Ikuti informasi resmi dan hubungi petugas bila perlu',
        instruction: 'Jangan kembali ke bangunan rusak sampai dinyatakan aman oleh pihak berwenang.',
        why: 'Penilaian keselamatan bangunan memerlukan pemeriksaan di lokasi.',
        fallback: 'Laporkan orang yang membutuhkan bantuan kepada petugas; jangan masuk ke bangunan rusak.'
      }
    ],
    kebakaran: [
      {
        id: 's1',
        title: 'Menjauh dari api dan asap jika jalur keluar aman',
        instruction: 'Jangan mengambil barang. Jika jalur terhalang api atau asap, jangan memaksakan diri melewatinya.',
        why: 'Aplikasi tidak mengetahui posisi api, asap, atau jalur keluar Anda.',
        fallback: 'Cari perlindungan dari asap dan hubungi pemadam atau layanan darurat resmi setempat.'
      },
      {
        id: 's2',
        title: 'Jika ada asap, tetap serendah mungkin',
        instruction: 'Jangan membuka pintu yang terasa panas. Jangan gunakan lift.',
        why: 'Asap dan api dapat berubah cepat; jangan masuk ke area yang tidak diketahui aman.',
        fallback: 'Beritahu petugas lokasi Anda dan ikuti instruksi mereka.'
      },
      {
        id: 's3',
        title: 'Hubungi petugas pemadam setempat',
        instruction: 'Berikan lokasi kejadian melalui kanal darurat resmi yang tersedia di wilayah Anda.',
        why: 'Tombol SOS aplikasi ini tidak menghubungi petugas.',
        fallback: 'Minta bantuan orang sekitar untuk menghubungi petugas jika Anda tidak dapat menelepon.'
      }
    ],
    longsor: [
      {
        id: 's1',
        title: 'Jauhi lereng dan jalur material longsor',
        instruction: 'Jangan mendekati atau melintasi area longsor. Pindah hanya melalui jalur yang dinyatakan aman oleh petugas.',
        why: 'Longsor susulan dan bahaya di sekitar lokasi tidak dapat dinilai aplikasi.',
        fallback: 'Jauhi area terdampak dan hubungi layanan darurat resmi setempat.'
      },
      {
        id: 's2',
        title: 'Ikuti arahan evakuasi resmi',
        instruction: 'Aplikasi ini tidak memiliki peta zona bahaya atau rute longsor terkini.',
        why: 'Rute yang aman harus ditentukan berdasarkan kondisi lapangan.',
        fallback: 'Jangan kembali ke area terdampak sebelum ada izin petugas.'
      },
      {
        id: 's3',
        title: 'Laporkan orang yang membutuhkan bantuan',
        instruction: 'Sampaikan lokasi dan kebutuhan kepada petugas melalui kanal resmi.',
        why: 'Laporan prototipe tidak mengirim bantuan.',
        fallback: 'Jangan memasuki area longsor untuk menolong tanpa arahan petugas.'
      }
    ],
    erupsi: [
      {
        id: 's1',
        title: 'Ikuti perintah resmi dan zona bahaya',
        instruction: 'Aplikasi ini tidak memantau aktivitas gunung, arah sebaran, atau zona bahaya terkini.',
        why: 'Kondisi erupsi dapat berubah cepat dan memerlukan informasi resmi.',
        fallback: 'Hubungi petugas setempat untuk mengetahui tindakan dan lokasi perlindungan yang ditetapkan.'
      },
      {
        id: 's2',
        title: 'Jauhi kawah dan aliran material',
        instruction: 'Gunakan hanya jalur evakuasi yang ditetapkan petugas; jangan menerobos zona terlarang.',
        why: 'Peta dan rute dalam aplikasi ini tidak terverifikasi.',
        fallback: 'Bergerak menjauhi zona berbahaya hanya mengikuti arahan petugas.'
      },
      {
        id: 's3',
        title: 'Hubungi petugas jika membutuhkan bantuan',
        instruction: 'Sampaikan lokasi dan kebutuhan melalui kanal darurat resmi setempat.',
        why: 'Tombol SOS aplikasi ini tidak menghubungi petugas.',
        fallback: 'Minta bantuan orang sekitar untuk menghubungi petugas jika Anda tidak dapat menelepon.'
      }
    ],
    lainnya: [
      {
        id: 's1',
        title: 'Jauhi bahaya langsung jika ada jalur yang jelas aman',
        instruction: 'Aplikasi ini tidak dapat mengidentifikasi ancaman spesifik dari laporan Anda.',
        why: 'Panduan khusus tidak dapat dipilih tanpa mengetahui jenis ancaman.',
        fallback: 'Jangan bergerak ke area yang belum diketahui aman; hubungi petugas setempat.'
      },
      {
        id: 's2',
        title: 'Ikuti instruksi petugas di lokasi',
        instruction: 'Jangan mengikuti rute atau titik evakuasi contoh dari aplikasi ini.',
        why: 'Data lokasi dan rute dalam prototipe bukan informasi operasional.',
        fallback: 'Gunakan kanal darurat resmi wilayah Anda untuk meminta arahan.'
      },
      {
        id: 's3',
        title: 'Laporkan kebutuhan bantuan',
        instruction: 'Sampaikan jenis ancaman, lokasi, dan kebutuhan kepada petugas.',
        why: 'Laporan SOS prototipe tidak mengirim petugas.',
        fallback: 'Minta bantuan orang sekitar untuk menghubungi petugas jika Anda tidak dapat menelepon.'
      }
    ]
  };

  const currentHazardSteps = stepsByHazard[hazardData.type] || stepsByHazard.lainnya;
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
              <span className="text-xs text-blue-200">Panduan demo · bukan layanan resmi</span>
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
            <span>LANGKAH UMUM · PERIKSA ARAHAN RESMI</span>
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
            <p className="font-bold text-xs text-slate-800">Periksa Status Keluarga</p>
            <p className="text-[11px] text-slate-500">Check-in dilakukan manual</p>
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
            <p className="font-bold text-xs text-slate-800">Peta & Rute Contoh</p>
            <p className="text-[11px] text-slate-500">Tidak untuk navigasi nyata</p>
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
            <p className="text-[11px] text-rose-600 font-semibold">Bukan dispatch petugas</p>
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
