import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  Volume2, 
  Users, 
  MapPin, 
  CheckSquare, 
  Radio, 
  Zap,
  Clock,
  Layers
} from 'lucide-react';

export default function OnboardingScreen({ onStartApp, onQuickExplore }) {
  const highlights = [
    {
      icon: 'ShieldCheck',
      title: 'Tindakan Berurutan di Bawah Tekanan',
      desc: 'Mengurangi kepanikan dengan 1 tindakan jelas per langkah saat kondisi darurat.'
    },
    {
      icon: 'Users',
      title: 'Perhatian Keluarga & Kebutuhan Khusus',
      desc: 'Catat lansia, anak-anak, atau obat penting tanpa pelacakan lokasi yang menginvasi privasi.'
    },
    {
      icon: 'MapPin',
      title: 'Transparansi Rute & Posko',
      desc: 'Data yang belum diverifikasi ditandai jelas. Aplikasi belum menyediakan rute evakuasi yang terverifikasi.'
    },
    {
      icon: 'Sparkles',
      title: 'Input Teks & Contoh Suara',
      desc: 'Transkrip suara hanya simulasi teks; panduan statis tidak menganalisis keadaan lapangan.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-4">
      {/* Brand Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E3F2FD] border border-[#90CAF9] text-xs font-bold text-[#0D47A1]">
          <span className="w-2 h-2 rounded-full bg-[#2196F3] animate-ping"></span>
          <span>Dokumen PRD Versi 1.1 — Prototype Interaktif</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          AI Disaster Assistant
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-normal">
          Platform Web Pendamping Keputusan dan Evakuasi Saat Bencana. <br />
          <span className="text-[#0D47A1] font-semibold">“Tetap tenang. Pahami situasi. Ambil langkah aman.”</span>
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {highlights.map((h, i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#2196F3] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center mb-3">
              {i === 0 && <ShieldCheck className="w-5 h-5 text-[#2196F3]" />}
              {i === 1 && <Users className="w-5 h-5 text-[#2196F3]" />}
              {i === 2 && <MapPin className="w-5 h-5 text-[#2196F3]" />}
              {i === 3 && <Sparkles className="w-5 h-5 text-[#2196F3]" />}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{h.title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>

      {/* Primary Onboarding CTA */}
      <div className="p-6 bg-gradient-to-r from-[#0D47A1] to-[#2196F3] rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">Mulai Alur Kesiapsiagaan</h3>
          <p className="text-xs text-blue-100 max-w-md">
            Langsung akses simulasi tanpa registrasi akun, bebas hambatan saat waktu genting.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onStartApp}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-[#0D47A1] hover:bg-[#E3F2FD] rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <span>Mulai Sekarang</span>
            <ArrowRight className="w-4 h-4 text-[#2196F3]" />
          </button>
        </div>
      </div>

      <div className="glass-card p-4 flex items-start gap-3">
        <Eye className="w-5 h-5 text-[#0D47A1] shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed">
          Data peta, lokasi, peringatan, dan alur berbagi pada prototype diberi label simulasi. Panduan ini tidak menggantikan arahan petugas resmi atau layanan darurat setempat.
        </p>
      </div>
    </div>
  );
}
