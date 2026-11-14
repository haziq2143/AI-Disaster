'use client';

import React, { useState } from 'react';
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
  Layers,
  Compass,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Heart,
  Navigation,
  FileText
} from 'lucide-react';

export default function OnboardingScreen({ onStartApp, onQuickExplore }) {
  const [activeTab, setActiveTab] = useState('flow'); // 'flow' | 'roles' | 'hotline'

  const flowSteps = [
    {
      step: '01',
      title: 'Lapor Situasi & Anggota Rentan',
      icon: AlertTriangle,
      color: 'rose',
      badge: 'Tahap Deteksi Awal',
      desc: 'Pilih jenis bencana (Gempa, Banjir, Longsor, Kebakaran) atau gunakan preset cepat 1-klik. Laporkan jika sedang bersama lansia berkursi roda, balita, atau orang yang membutuhkan obat rutin.',
      keyFeatures: ['Preset cepat 1-klik', 'Kalkulasi kebutuhan kelompok rentan', 'Input suara / teks ringkas']
    },
    {
      step: '02',
      title: 'Panduan Tindakan 1-Langkah',
      icon: CheckSquare,
      color: 'blue',
      badge: 'Kognisi Anti-Panik',
      desc: 'Saat kognitif menurun drastis akibat stres panik, instruksi tidak disajikan dalam paragraf panjang. Sistem memandu Anda satu langkah jelas pada satu waktu hingga tuntas.',
      keyFeatures: ['Instruksi fokus 1 per 1', 'Audio suara Bahasa Indonesia jernih', 'Konfirmasi langkah selesai']
    },
    {
      step: '03',
      title: 'Navigasi Rute Aman & Posko',
      icon: Navigation,
      color: 'emerald',
      badge: 'Rute Bebas Bahaya',
      desc: 'Algoritma jalan riil (OSRM) secara otomatis menghindari zona bahaya, genangan air tinggi, dan jembatan roboh. Sistem mengarahkan Anda ke posko terdekat yang kapasitasnya masih tersedia.',
      keyFeatures: ['Penghindaran rintangan dinamis', 'Status kapasitas & logistik posko', 'Panduan navigasi turn-by-turn']
    },
    {
      step: '04',
      title: 'Koordinasi Keluarga & Peluit SOS',
      icon: Radio,
      color: 'amber',
      badge: 'Pertolongan Darurat',
      desc: 'Pantau status anggota keluarga tanpa pulsa saat jaringan padat. Jika terjebak di bawah reruntuhan, aktifkan peluit 3.000 Hz yang dirancang khusus menembus puing beton.',
      keyFeatures: ['Family Safety low-bandwidth', 'Peluit akustik 3.000 Hz untuk K9 SAR', 'Kartu medis offline PWA']
    }
  ];

  const roles = [
    {
      role: 'Warga Mandiri',
      icon: ShieldCheck,
      color: 'blue',
      desc: 'Menerima panduan evakuasi instan, memilih rute jalan bebas banjir, dan membunyikan sinyal darurat saat terjebak.'
    },
    {
      role: 'Kepala / Anggota Keluarga',
      icon: Users,
      color: 'emerald',
      desc: 'Menghubungkan sanak keluarga dalam grup siaga, memantau titik kumpul, dan membagikan status aman tanpa ketergantungan pulsa.'
    },
    {
      role: 'Petugas SAR & Relawan Posko',
      icon: Radio,
      color: 'indigo',
      desc: 'Memantau radar triase laporan warga, memvalidasi zona bahaya baru di lapangan, dan memperbarui kapasitas pengungsi posko secara real-time.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-4 px-2 sm:px-4">
      {/* Brand Header & Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            Panduan Alur Resmi · Sistem Tanggap Darurat Evacu8
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Alur Penyelamatan Terpadu
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Evacu8 dirancang untuk membimbing warga mengambil keputusan penyelamatan secara berurutan, menjaga koordinasi keluarga saat krisis, dan menghubungkan posko ke titik korban.
        </p>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('flow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'flow'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            4 Tahapan Evakuasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Peran & Pengguna
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hotline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hotline'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kontak Darurat Nasional
          </button>
        </div>
      </div>

      {/* TAB 1: 4 TAHAPAN EVAKUASI */}
      {activeTab === 'flow' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flowSteps.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={idx} 
                  className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                          item.color === 'rose'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : item.color === 'blue'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : item.color === 'emerald'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Langkah {item.step}
                          </span>
                          <h3 className="font-black text-slate-900 text-base leading-tight">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        item.color === 'rose'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.color === 'blue'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.color === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Fitur Kunci:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keyFeatures.map((feat, fIdx) => (
                        <span 
                          key={fIdx}
                          className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-700 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PERAN PENGGUNA */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          {roles.map((r, i) => {
            const IconComp = r.icon;
            return (
              <div key={i} className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  r.color === 'blue'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : r.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-900 text-base">{r.role}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {r.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: KONTAK DARURAT RESMI */}
      {activeTab === 'hotline' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Panggilan Darurat', number: '112', agency: 'Layanan Terpadu Nasional', color: 'rose' },
              { label: 'SAR / Penyelamatan', number: '115', agency: 'BASARNAS Indonesia', color: 'blue' },
              { label: 'Posko Bencana', number: '117', agency: 'BNPB Indonesia', color: 'amber' },
              { label: 'Ambulans / Medis', number: '119', agency: 'Kemenkes RI / PMI', color: 'emerald' }
            ].map((hot, hIdx) => (
              <a
                key={hIdx}
                href={`tel:${hot.number}`}
                className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-400 hover:shadow-md transition-all text-center space-y-1 block group"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {hot.label}
                </span>
                <span className="text-2xl font-black text-slate-950 block group-hover:text-blue-600 transition-colors">
                  {hot.number}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  {hot.agency}
                </span>
              </a>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
            <PhoneCall className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Nomor panggilan darurat di atas dapat dihubungi bebas pulsa dari semua operator seluler di Indonesia, bahkan saat nomor tidak memiliki sisa pulsa atau masa aktif kartu habis.
            </p>
          </div>
        </div>
      )}

      {/* Primary Action Card */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-extrabold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Kesiapsiagaan Cepat</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Siap Hadapi Kondisi Tak Terduga</h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-lg leading-relaxed font-normal">
            Buka aplikasi langsung tanpa registrasi akun, data tersimpan aman di browser HP Anda secara offline.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onStartApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-900 hover:bg-blue-50 rounded-2xl font-black text-sm shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <span>Mulai Gunakan Aplikasi</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Transparent Civic-Tech Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-start gap-3 text-xs text-slate-600">
        <Eye className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Evacu8 adalah platform pendamping evakuasi dan kesiapsiagaan mandiri. Pada situasi lapangan yang berubah dinamis, tetap utamakan keselamatan diri dan arahan regu penolong resmi (BPBD, BASARNAS, dan relawan kemanusiaan setempat).
        </p>
      </div>
    </div>
  );
}
