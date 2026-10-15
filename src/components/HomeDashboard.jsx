import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Waves, 
  Activity, 
  Mountain, 
  HelpCircle, 
  Sparkles, 
  Users, 
  MapPin, 
  CheckSquare, 
  ArrowRight, 
  PhoneCall, 
  Info, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  Clock,
  Radio,
  FileCheck
} from 'lucide-react';
import { HAZARD_TYPES, OFFICIAL_SOURCES } from '../data/mockData';

export default function HomeDashboard({ onSelectFlow, onNavigateScreen, hazardData, setHazardData }) {
  const [selectedQuickHazard, setSelectedQuickHazard] = useState(hazardData.type || 'banjir');

  const handleHazardClick = (hazard) => {
    setSelectedQuickHazard(hazard.id);
    setHazardData(prev => ({ ...prev, type: hazard.id }));
  };

  const handleTriggerEmergency = () => {
    setHazardData(prev => ({ ...prev, type: selectedQuickHazard }));
    onSelectFlow('emergency_input');
  };

  const handlePreparedness = () => {
    setHazardData(prev => ({ ...prev, type: selectedQuickHazard }));
    onNavigateScreen('checklist');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Demo Notice as required by PRD 4.9 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#E3F2FD] border border-[#90CAF9] rounded-xl text-xs font-medium text-[#0D47A1]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#0D47A1] text-white text-[10px] font-bold tracking-wider rounded uppercase">DATA DEMO</span>
          <span>Prototype Pengujian UI/UX — Bukan pengganti arahan resmi BMKG/BPBD</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#2196F3]" /> Simulasi Aktif</span>
          <span className="flex items-center gap-1 font-semibold text-[#0D47A1]"><PhoneCall className="w-3.5 h-3.5 text-[#2196F3]" /> Darurat: 112 / 115</span>
        </div>
      </div>

      {/* Hero Primary Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#2196F3] p-6 sm:p-10 text-white shadow-xl shadow-blue-900/10">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#90CAF9]/10 blur-xl pointer-events-none"></div>

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium tracking-wide">
            <Radio className="w-4 h-4 text-[#90CAF9] animate-pulse" />
            <span>Pendamping Keputusan & Evakuasi Cepat Terstruktur</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              “Tetap tenang. Pahami situasi. <br className="hidden sm:inline" />
              <span className="text-[#90CAF9]">Ambil langkah aman.”</span>
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Bantuan panduan awal saat darurat melanda. Mengubah kepanikan menjadi tindakan berurutan, terverifikasi, dan mempertimbangkan keselamatan seluruh anggota keluarga.
            </p>
          </div>

          {/* Core Action Callouts */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <button
              onClick={handleTriggerEmergency}
              className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#0D47A1] hover:bg-[#E3F2FD] rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
            >
              <ShieldAlert className="w-6 h-6 text-rose-600 transition-transform group-hover:scale-110" />
              <span>Saya Sedang Dalam Keadaan Darurat</span>
              <ArrowRight className="w-5 h-5 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handlePreparedness}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-2xl font-semibold text-sm sm:text-base backdrop-blur-sm transition-all duration-200 cursor-pointer"
            >
              <span>Cari Kesiapsiagaan & Checklist</span>
              <ChevronRight className="w-4 h-4 text-[#90CAF9]" />
            </button>
          </div>
        </div>
      </div>

      {/* Hazard Selector - Card Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D47A1]">Pilih Skenario Bencana</h2>
            <p className="text-xs sm:text-sm text-slate-500">Pilih jenis peristiwa untuk mendapatkan arahan AI yang sesuai konteks lapangan</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#E3F2FD] text-[#0D47A1] rounded-lg border border-[#90CAF9]">
            6 Skenario Siaga
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {HAZARD_TYPES.map((item) => {
            const isSelected = selectedQuickHazard === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleHazardClick(item)}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer group text-left ${
                  isSelected 
                    ? 'bg-[#E3F2FD] border-[#2196F3] shadow-md shadow-blue-500/10 ring-2 ring-[#2196F3]' 
                    : 'bg-white border-slate-200 hover:border-[#90CAF9] hover:bg-slate-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? 'bg-[#0D47A1] text-white shadow-sm' : 'bg-[#E3F2FD] text-[#0D47A1] group-hover:bg-[#90CAF9]/40'
                }`}>
                  {item.id === 'banjir' && <Waves className="w-6 h-6" />}
                  {item.id === 'gempa' && <Activity className="w-6 h-6" />}
                  {item.id === 'kebakaran' && <Flame className="w-6 h-6" />}
                  {item.id === 'longsor' && <Mountain className="w-6 h-6" />}
                  {item.id === 'erupsi' && <Mountain className="w-6 h-6" />}
                  {item.id === 'lainnya' && <HelpCircle className="w-6 h-6" />}
                </div>
                <span className={`text-sm font-bold ${isSelected ? 'text-[#0D47A1]' : 'text-slate-800'}`}>
                  {item.label}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Access Tiles - Clean and Minimal */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tile 1: Family Safety */}
        <div 
          onClick={() => onNavigateScreen('family')}
          className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#2196F3] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center group-hover:bg-[#0D47A1] group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base group-hover:text-[#0D47A1] transition-colors">
                Family Safety Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pantau kesiapan lansia, balita, atau anggota keluarga dengan kebutuhan khusus tanpa pelacakan GPS invasi privasi.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D47A1]">
            <span>Kelola Anggota</span>
            <ArrowRight className="w-4 h-4 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tile 2: Safe Route */}
        <div 
          onClick={() => onNavigateScreen('route')}
          className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#2196F3] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center group-hover:bg-[#0D47A1] group-hover:text-white transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base group-hover:text-[#0D47A1] transition-colors">
                Safe Route & Titik Evakuasi
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Temukan posko terverifikasi dengan label status jelas. Rute tanpa kepastian akan ditandai secara transparan.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D47A1]">
            <span>Lihat Posko & Peta</span>
            <ArrowRight className="w-4 h-4 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tile 3: Emergency Checklist */}
        <div 
          onClick={() => onNavigateScreen('checklist')}
          className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#2196F3] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center group-hover:bg-[#0D47A1] group-hover:text-white transition-colors">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base group-hover:text-[#0D47A1] transition-colors">
                Emergency Kit Checklist
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Daftar tas siaga darurat esensial (P3K, dokumen anti-air, ransum). Jangan kembali ke lokasi rawan demi barang.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D47A1]">
            <span>Buka Tas Siaga</span>
            <ArrowRight className="w-4 h-4 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tile 4: Global Safety Map */}
        <button
          type="button"
          onClick={() => onNavigateScreen('safety_map')}
          className="group text-left p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#2196F3] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] text-[#0D47A1] flex items-center justify-center group-hover:bg-[#0D47A1] group-hover:text-white transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base group-hover:text-[#0D47A1] transition-colors">
                Global Safety Map
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Lihat laporan status komunitas dengan area perkiraan, waktu pembaruan, dan label data demo.
              </p>
            </div>
          </div>
          <span className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D47A1]">
            <span>Lihat peta komunitas</span>
            <ArrowRight className="w-4 h-4 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>

      {/* Official Transparency Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Info className="w-4 h-4 text-[#2196F3]" />
            <span>Kanal Informasi Resmi Terhubung (Simulasi)</span>
          </div>
          <span className="text-[11px] text-slate-500">Pembaruan berkala sesuai protokol kebencanaan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OFFICIAL_SOURCES.map((src, idx) => (
            <div key={idx} className="p-3 bg-[#E3F2FD]/50 rounded-xl border border-[#90CAF9]/40 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#0D47A1]">{src.name}</p>
                <p className="text-[11px] text-slate-500">Update {src.update}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                AKTIF
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
