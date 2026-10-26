import React, { useEffect, useState } from 'react';
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
  const [offlineState, setOfflineState] = useState('checking');
  const [offlineMessage, setOfflineMessage] = useState('');
  const selectedHazard = HAZARD_TYPES.find(hazard => hazard.id === selectedQuickHazard) || HAZARD_TYPES[0];

  useEffect(() => {
    let isMounted = true;
    async function checkOfflineSupport() {
      if (!('serviceWorker' in navigator)) {
        if (isMounted) setOfflineState('unsupported');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        if (isMounted) setOfflineState(registration.active ? 'available' : 'unavailable');
      } catch {
        if (isMounted) setOfflineState('unavailable');
      }
    }
    checkOfflineSupport();
    const handleMessage = event => {
      if (event.data?.type !== 'OFFLINE_READY') return;
      setOfflineState(event.data.failedCount === 0 ? 'saved' : 'partial');
      setOfflineMessage(`${event.data.cachedCount} materi tersimpan${event.data.failedCount ? `, ${event.data.failedCount} gagal dimuat` : ''}.`);
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      isMounted = false;
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const handlePrepareOffline = async () => {
    if (!('serviceWorker' in navigator)) {
      setOfflineState('unsupported');
      return;
    }
    setOfflineState('saving');
    setOfflineMessage('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const worker = registration.active;
      if (!worker) throw new Error('Dukungan offline belum siap. Muat ulang halaman dan coba lagi.');

      const urls = performance.getEntriesByType('resource')
        .map(entry => new URL(entry.name, window.location.origin))
        .filter(url => url.origin === window.location.origin && url.pathname.startsWith('/_next/static/'))
        .map(url => url.href);
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => {
        channel.port1.close();
        setOfflineState('unavailable');
        setOfflineMessage('Penyimpanan offline terlalu lama. Periksa koneksi dan coba lagi.');
      }, 15000);
      channel.port1.onmessage = event => {
        window.clearTimeout(timeout);
        channel.port1.close();
        if (event.data?.type === 'OFFLINE_READY') {
          setOfflineState(event.data.failedCount === 0 ? 'saved' : 'partial');
          setOfflineMessage(`${event.data.cachedCount} materi tersimpan${event.data.failedCount ? `, ${event.data.failedCount} gagal dimuat` : ''}.`);
        }
      };
      worker.postMessage({ type: 'PREPARE_OFFLINE', urls }, [channel.port2]);
    } catch (error) {
      setOfflineState('unavailable');
      setOfflineMessage(error instanceof Error ? error.message : 'Materi offline gagal disiapkan.');
    }
  };

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

      <section className="rounded-2xl border border-blue-200 bg-white/85 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <span className="demo-badge">Akses offline</span>
          <h2 className="mt-2 text-sm font-extrabold text-slate-900">Simpan aplikasi & materi penting di perangkat</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Halaman yang sudah dibuka dan checklist tersimpan bisa dicoba saat offline. Peta tile, panggilan, data baru, dan pengiriman laporan tetap memerlukan jaringan.
          </p>
          {offlineMessage && <p role="status" className="mt-1 text-xs font-semibold text-blue-800">{offlineMessage}</p>}
          {offlineState === 'unsupported' && <p role="status" className="mt-1 text-xs text-amber-800">Browser ini tidak mendukung penyimpanan offline otomatis.</p>}
        </div>
        <button
          type="button"
          onClick={handlePrepareOffline}
          disabled={offlineState === 'saving' || offlineState === 'checking'}
          className="mt-3 inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-[#0D47A1] px-4 py-2 text-xs font-bold text-white hover:bg-[#1565C0] disabled:cursor-wait disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          {offlineState === 'saving' ? 'Menyimpan…' : offlineState === 'saved' ? 'Perbarui materi offline' : 'Siapkan akses offline'}
        </button>
      </section>

      {/* Hero Primary Section */}
      <div className="home-hero relative overflow-hidden rounded-[2rem] p-6 sm:p-10 text-white">
        {/* Subtle decorative circles */}
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />

        <div className="relative grid lg:grid-cols-[1.15fr_0.85fr] items-center gap-8 lg:gap-4">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium tracking-wide">
              <Radio className="w-4 h-4 text-[#90CAF9] animate-pulse" />
              <span>Pendamping keputusan saat darurat</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
                Tetap tenang.<br />
                Pahami situasi.<br />
                <span className="text-[#90CAF9]">Ambil langkah aman.</span>
              </h1>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Panduan awal yang ringkas, bertahap, dan mempertimbangkan keselamatan seluruh anggota keluarga.
              </p>
            </div>

            {/* Core Action Callouts */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleTriggerEmergency}
                className="group relative flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#0D47A1] hover:bg-[#E3F2FD] rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5 text-rose-600 transition-transform group-hover:scale-110" />
                <span>Saya sedang darurat</span>
                <ArrowRight className="w-4 h-4 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handlePreparedness}
                className="flex items-center justify-center gap-2 px-5 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-2xl font-semibold text-xs sm:text-sm backdrop-blur-sm transition-all duration-200 cursor-pointer"
              >
                <span>Siapkan tas siaga</span>
                <ChevronRight className="w-4 h-4 text-[#90CAF9]" />
              </button>
            </div>
          </div>

          <div className="hero-visual relative hidden md:flex items-center justify-center min-h-[270px]" aria-label="Ilustrasi peta simulasi">
            <div className="hero-radar">
              <span className="hero-radar-ring hero-radar-ring-one" />
              <span className="hero-radar-ring hero-radar-ring-two" />
              <span className="hero-radar-ring hero-radar-ring-three" />
              <span className="hero-radar-cross hero-radar-cross-one" />
              <span className="hero-radar-cross hero-radar-cross-two" />
              <span className="hero-radar-route" />
              <span className="hero-radar-point hero-radar-point-one" />
              <span className="hero-radar-point hero-radar-point-two" />
              <span className="hero-radar-center"><MapPin className="w-6 h-6" /></span>
            </div>
            <div className="hero-float-card hero-float-card-top">
              <span className="hero-float-icon"><MapPin className="w-4 h-4" /></span>
              <span><small>SKENARIO DIPILIH</small><strong>{selectedHazard.label}</strong></span>
            </div>
            <div className="hero-float-card hero-float-card-bottom">
              <span className="hero-status-dot" />
              <span><small>AREA CONTOH</small><strong>Data demo · bukan live</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Hazard Selector - Card Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0D47A1]">Pilih Skenario Bencana</h2>
            <p className="text-xs sm:text-sm text-slate-500">Pilih skenario untuk melihat panduan umum demo; aplikasi tidak menganalisis atau memverifikasi kondisi lapangan.</p>
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
                aria-pressed={isSelected}
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
        <button 
          type="button"
          onClick={() => onNavigateScreen('family')}
          className="group text-left p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#2196F3] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
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
        </button>

        {/* Tile 2: Safe Route */}
        <button
          type="button"
          onClick={() => onNavigateScreen('route')}
          className="group text-left p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#2196F3] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
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
                Jelajahi titik evakuasi contoh. Data rute dan kondisi lapangan belum terhubung atau terverifikasi.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0D47A1]">
            <span>Lihat Posko & Peta</span>
            <ArrowRight className="w-4 h-4 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Tile 3: Emergency Checklist */}
        <button
          type="button"
          onClick={() => onNavigateScreen('checklist')}
          className="group text-left p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#2196F3] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
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
        </button>

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
            <span>Rujukan Sumber Resmi (Tidak Terhubung)</span>
          </div>
          <span className="demo-badge">Contoh informasi · tidak real-time</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OFFICIAL_SOURCES.map((src, idx) => (
            <div key={idx} className="p-3 bg-[#E3F2FD]/50 rounded-xl border border-[#90CAF9]/40 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#0D47A1]">{src.name}</p>
                <p className="text-[11px] text-slate-500">{src.update}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
              DEMO
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
