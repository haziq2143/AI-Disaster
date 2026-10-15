import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  AlertOctagon, 
  Info,
  PhoneCall,
  Flame,
  Waves,
  ZapOff
} from 'lucide-react';
import { HAZARD_TYPES, OFFICIAL_SOURCES } from '../data/mockData';
import { api } from '../services/api';

export default function SituationAssessment({ 
  hazardData, 
  onEnterEmergencyMode, 
  onBack,
  onNavigateScreen 
}) {
  const [analyzing, setAnalyzing] = useState(true);
  const [serverAssessment, setServerAssessment] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAssessment() {
      const response = await api.requestAssessment({
        hazard_type: hazardData.type,
        user_description: hazardData.description,
        clarifications: hazardData.clarifications,
        location: hazardData.location
      });
      if (isMounted) {
        if (response && response.data) {
          setServerAssessment(response.data);
        }
        setAnalyzing(false);
      }
    }
    fetchAssessment();
    return () => { isMounted = false; };
  }, [hazardData]);

  const hazardObj = HAZARD_TYPES.find(h => h.id === hazardData.type) || HAZARD_TYPES[0];

  // Dynamic assessment content tailored to hazard and input
  const getAssessmentDetails = () => {
    if (hazardData.type === 'gempa') {
      return {
        summary: `Guncangan gempa bumi telah merusak struktur sebagian dinding dan aliran listrik padam. Terdapat kebutuhan berkumpul di ruang terbuka bersama keluarga.`,
        urgencyLevel: 'TINGGI — PRIORITAS EVAKUASI KE RUANG TERBUKA',
        urgencyBadgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        knownConditions: [
          'Guncangan telah terjadi, ada potensi gempa susulan.',
          'Dinding rumah retak, risiko runtuh jika ada gempa lanjutan.',
          'Kondisi listrik padam memerlukan penerangan darurat mandiri.'
        ],
        unknowns: [
          'Tingkat kerusakan pondasi struktural belum diperiksa ahli teknik.',
          'Kondisi pipa gas / instalasi listrik tetangga sekitar.'
        ],
        immediateActions: [
          { title: 'Jauhi bangunan dan tiang listrik', desc: 'Segera bergerak ke tanah lapang, taman, atau jalan lebar tanpa kanopi rapuh.', critical: true },
          { title: 'Matikan MCB / Sekring Utama', desc: 'Cegah kebakaran akibat korsleting saat listrik kembali menyala.', critical: true },
          { title: 'Lindungi kepala dengan tas / helm', desc: 'Gunakan pelindung kepala saat bergerak melintasi puing dan reruntuhan.', critical: false }
        ],
        nextActions: [
          'Jangan langsung masuk kembali ke dalam rumah untuk mengambil barang.',
          'Nyalakan radio darurat atau pantau informasi resmi BMKG untuk update magnitudo dan potensi susulan.',
          'Verifikasi status fisik setiap anggota keluarga.'
        ]
      };
    } else if (hazardData.type === 'kebakaran') {
      return {
        summary: `Ancaman asap pekat dan potensi rambatan api dari ruko tetangga. Visibilitas berkurang dan kualitas udara menurun drastis.`,
        urgencyLevel: 'KRITIS — SEGERA EVAKUASI MENJAUHI ARAH ANGIN',
        urgencyBadgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
        knownConditions: [
          'Asap pekat dapat memicu keracunan karbon monoksida dalam hitungan menit.',
          'Api di bangunan terdekat berpotensi menyambar melalui atap/kanopi.',
          'Arah angin sangat mempengaruhi penyebaran gas beracun.'
        ],
        unknowns: [
          'Apakah jalur keluar utama terblokir oleh armada damkar atau kobaran api.',
          'Titik isolasi gas tabung LPG tetangga sekitar.'
        ],
        immediateActions: [
          { title: 'Tutup hidung & mulut dengan kain basah', desc: 'Rendahkan posisi tubuh (merangkak) jika asap tebal karena udara bersih ada di bawah.', critical: true },
          { title: 'Keluar segera bersama seluruh anggota keluarga', desc: 'Tinggalkan seluruh barang berharga, nyawa adalah prioritas tunggal.', critical: true },
          { title: 'Periksa daun pintu sebelum dibuka', desc: 'Sentuh gagang pintu dengan punggung tangan; jika panas, jangan dibuka!', critical: false }
        ],
        nextActions: [
          'Hubungi pemadam kebakaran 113 segera setelah berada di titik aman.',
          'Pastikan tidak ada orang yang tertinggal di dalam bangunan.',
          'Jangan pernah kembali masuk ke dalam gedung yang sedang terbakar.'
        ]
      };
    } else {
      // Default / Banjir
      return {
        summary: `Debit air banjir setinggi betis hingga lutut dengan arus aktif. Ada lansia dan anak kecil yang memerlukan bantuan mobilitas langsung.`,
        urgencyLevel: 'TINGGI — BUTUH EVAKUASI SEGERA SEBELUM AIR NAIK',
        urgencyBadgeColor: 'bg-blue-100 text-[#0D47A1] border-blue-300',
        knownConditions: [
          'Tinggi air di luar rumah mencapai 40-50 cm dan arus masih deras.',
          'Ada lansia yang butuh bantuan jalan dan anak balita yang butuh pendampingan penuh.',
          'Potensi kabel listrik terendam atau lubang got tidak terlihat.'
        ],
        unknowns: [
          'Elevasi persis titik evakuasi dan daya tampung posko saat ini.',
          'Kondisi arus di hilir gang menuju jalan raya protokol.'
        ],
        immediateActions: [
          { title: 'Matikan total meteran listrik (MCB) utama rumah', desc: 'Cegah sengatan listrik fatal di air banjir sebelum melangkah keluar.', critical: true },
          { title: 'Bantu lansia dan amankan balita terlebih dahulu', desc: 'Gunakan gendongan untuk balita dan dampingi lansia secara fisik di sisi kering.', critical: true },
          { title: 'Gunakan tongkat / payung untuk meraba pijakan kaki', desc: 'Pastikan tidak ada saluran got terbuka atau pecahan beling tak terlihat di dasar air.', critical: true }
        ],
        nextActions: [
          'Bawa tas siaga bencana (obat penting & dokumen kedap air).',
          'Bergerak ke posko evakuasi RW 04 yang berada di dataran tinggi.',
          'Tetap bersama kelompok dan hindari menyeberangi arus deras setinggi lutut.'
        ]
      };
    }
  };

  const localAssessment = getAssessmentDetails();
  const assessment = serverAssessment ? {
    summary: serverAssessment.situation_summary,
    urgencyLevel: serverAssessment.urgency_level,
    urgencyBadgeColor: serverAssessment.urgency_level.includes('KRITIS') 
      ? 'bg-rose-100 text-rose-900 border-rose-300' 
      : serverAssessment.urgency_level.includes('GEMPA') || serverAssessment.urgency_level.includes('TERBUKA')
        ? 'bg-amber-100 text-amber-900 border-amber-300'
        : 'bg-blue-100 text-[#0D47A1] border-blue-300',
    knownConditions: serverAssessment.known_conditions,
    unknowns: serverAssessment.missing_information,
    immediateActions: serverAssessment.immediate_actions,
    nextActions: serverAssessment.next_steps,
    confidenceLimitation: serverAssessment.confidence_limitation,
    sourceFreshness: serverAssessment.source_and_freshness,
    escalation: serverAssessment.escalation,
    isFromServer: true
  } : localAssessment;

  if (analyzing) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-full bg-[#E3F2FD] border-4 border-[#2196F3] border-t-transparent animate-spin"></div>
          <Sparkles className="w-8 h-8 text-[#0D47A1] absolute inset-0 m-auto" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-800">Menyusun AI Situation Assessment...</h3>
          <p className="text-xs text-slate-500">Mencocokkan kondisi dengan panduan resmi BNPB & protokol tanggap darurat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
          Langkah 3 dari 4: AI Situation Assessment
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
          Hasil Analisis & Rencana Tindakan
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Sesuai PRD 5.2 (AI Output Contract): Membedakan fakta yang diketahui, hal yang belum diketahui, dan rekomendasi.
        </p>
      </div>

      {/* Primary Urgency Card */}
      <div className="p-5 bg-white rounded-2xl border-2 border-[#2196F3] shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${assessment.urgencyBadgeColor}`}>
              {assessment.urgencyLevel}
            </span>
            {assessment.isFromServer && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E3F2FD] text-[#0D47A1] border border-[#90CAF9]">
                API BACKEND TERHUBUNG
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-[#2196F3]" /> Diperbarui: Baru saja
          </span>
        </div>

        {/* Situation Summary */}
        <div className="space-y-1 bg-[#E3F2FD]/50 p-3.5 rounded-xl border border-[#90CAF9]/60">
          <span className="text-xs font-bold text-[#0D47A1] uppercase tracking-wider block">
            Ringkasan Kondisi (Berdasarkan Laporan Anda)
          </span>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {assessment.summary}
          </p>
        </div>

        {/* Known facts vs Unknowns (PRD 4.3 & 5.2 requirement) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fakta yang Dikonfirmasi:</span>
            </div>
            <ul className="text-[11px] text-emerald-950 space-y-1 list-disc list-inside">
              {assessment.knownConditions.map((kc, i) => (
                <li key={i}>{kc}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Informasi Belum Diketahui:</span>
            </div>
            <ul className="text-[11px] text-amber-950 space-y-1 list-disc list-inside">
              {assessment.unknowns.map((uk, i) => (
                <li key={i}>{uk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Immediate Actions: "LAKUKAN SEKARANG" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              1. Lakukan Sekarang (Tindakan Kritis Awal)
            </h3>
          </div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
            Langkah Segera
          </span>
        </div>

        <div className="space-y-2.5">
          {assessment.immediateActions.map((action, idx) => (
            <div 
              key={idx}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-[#2196F3] shadow-xs flex items-start gap-3.5 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-xs">
                {idx + 1}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{action.title}</h4>
                  {action.critical && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      KRITIS
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{action.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Actions: "SETELAH LEBIH AMAN" */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#2196F3]" />
          <span>2. Langkah Lanjutan (Setelah Kondisi Relatif Stabil)</span>
        </h4>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside pl-1">
          {assessment.nextActions.map((na, i) => (
            <li key={i}>{na}</li>
          ))}
        </ul>
      </div>

      {/* AI Transparency & Limitations Banner */}
      <div className="p-3.5 bg-[#E3F2FD] rounded-xl border border-[#90CAF9] text-xs text-[#0D47A1] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#2196F3] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Batasan Keselamatan AI (PRD 5.2 Confidence & Limitation):</p>
          <p className="text-[11px] text-slate-600">
            AI bukan pengganti tim penyelamat. Jika kondisi memburuk seketika, segera evakuasi ke tempat lebih tinggi dan hubungi hotline 112/115.
          </p>
        </div>
      </div>

      {/* Primary CTA: Launch AI Emergency Mode */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Koreksi Input</span>
        </button>

        <button
          type="button"
          onClick={onEnterEmergencyMode}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-2xl font-extrabold text-base shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all cursor-pointer pulse-emergency"
        >
          <span>Masuk AI Emergency Mode</span>
          <ArrowRight className="w-5 h-5 text-[#90CAF9]" />
        </button>
      </div>
    </div>
  );
}
