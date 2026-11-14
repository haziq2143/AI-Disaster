'use client';

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
  FileCheck, 
  Check,
  Compass,
  Navigation,
  DownloadCloud,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { HAZARD_TYPES, OFFICIAL_SOURCES } from '../data/mockData';
import BmkgAlertBanner from './BmkgAlertBanner';
import SignalBeaconModal from './SignalBeaconModal';

export default function HomeDashboard({ onSelectFlow, onNavigateScreen, hazardData, setHazardData }) {
  const [selectedQuickHazard, setSelectedQuickHazard] = useState(hazardData.type || 'banjir');
  const [offlineState, setOfflineState] = useState('checking');
  const [offlineMessage, setOfflineMessage] = useState('');
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);
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
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Top Emergency Status & Direct Hotline Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl text-xs text-slate-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-extrabold text-slate-800">Sistem Siaga Bencana Aktif</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 font-medium hidden sm:inline">Kanal Darurat Siap</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <a 
            href="tel:112" 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold transition-colors cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
            <span>Hotline Darurat: 112 (Bebas Pulsa)</span>
          </a>
          <a 
            href="tel:115" 
            className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-[#0D47A1] border border-blue-200 hover:bg-blue-100 font-semibold transition-colors"
          >
            <span>BASARNAS: 115</span>
          </a>
        </div>
      </div>

      {/* Real-time BMKG Alert Feed */}
      <BmkgAlertBanner />

      {/* Hero Primary Bento Banner */}
      <div 
        className="rounded-[28px] sm:rounded-[32px] p-6 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-blue-950/10"
        style={{
          background: `
            radial-gradient(circle at 85% 20%, rgba(96, 165, 250, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 10% 80%, rgba(129, 140, 248, 0.3) 0%, transparent 45%),
            linear-gradient(135deg, #0A2540 0%, #154580 40%, #1E3A8A 75%, #3B82F6 100%)
          `
        }}
      >
        {/* Subtle Ambient Glowing Orbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-[1.2fr_0.8fr] items-center gap-8 lg:gap-10">
          <div className="space-y-5">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold tracking-wide">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Panduan Cepat Terstruktur 1-Langkah</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.18] text-white">
                Tetap tenang.<br />
                Pahami situasi.<br />
                <span className="text-[#90CAF9]">Ambil langkah aman.</span>
              </h1>
              <p className="text-blue-100/90 text-xs sm:text-base leading-relaxed max-w-xl font-normal">
                Panduan awal terstruktur yang dirancang agar warga tidak panik, menjaga koordinasi keluarga, dan menghubungkan posko evakuasi aman.
              </p>
            </div>

            {/* Core Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleTriggerEmergency}
                className="group flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-[#0D47A1] hover:bg-blue-50 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5 text-rose-600 transition-transform group-hover:scale-110" />
                <span>Mulai Panduan Darurat</span>
                <ArrowRight className="w-4 h-4 text-[#2196F3] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setIsBeaconOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40 rounded-2xl font-bold text-xs sm:text-sm backdrop-blur-sm transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-md"
              >
                <Radio className="w-4 h-4 text-white animate-pulse" />
                <span>Peluit SOS 3.000 Hz</span>
              </button>

              <button
                type="button"
                onClick={handlePreparedness}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-2xl font-semibold text-xs sm:text-sm backdrop-blur-sm transition-all hover:scale-102 cursor-pointer"
              >
                <span>Tas Siaga 72 Jam</span>
                <ChevronRight className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          </div>

          {/* Right Visual Radar HUD Card */}
          <div className="hero-visual relative hidden md:flex items-center justify-center min-h-[260px]">
            <div className="hero-radar">
              <span className="hero-radar-ring hero-radar-ring-one" />
              <span className="hero-radar-ring hero-radar-ring-two" />
              <span className="hero-radar-ring hero-radar-ring-three" />
              <span className="hero-radar-cross hero-radar-cross-one" />
              <span className="hero-radar-cross hero-radar-cross-two" />
              <span className="hero-radar-route" />
              <span className="hero-radar-point hero-radar-point-one" />
              <span className="hero-radar-point hero-radar-point-two" />
              <span className="hero-radar-center">
                <MapPin className="w-6 h-6 text-[#0D47A1]" />
              </span>
            </div>

            <div className="hero-float-card hero-float-card-top">
              <span className="hero-float-icon">
                <MapPin className="w-4 h-4 text-blue-300" />
              </span>
              <span>
                <small className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">SKENARIO AKTIF</small>
                <strong className="text-white text-xs block font-extrabold">{selectedHazard.label}</strong>
              </span>
            </div>

            <div className="hero-float-card hero-float-card-bottom">
              <span className="hero-status-dot bg-emerald-400" />
              <span>
                <small className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">STATUS POSKO</small>
                <strong className="text-white text-xs block font-extrabold">Terbuka & Terverifikasi</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hazard Selector - Elegant Bento Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0D47A1] bg-blue-100 px-2.5 py-0.5 rounded-full">
              Pilihan Cepat
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Pilih Skenario Bencana
            </h2>
            <p className="text-xs text-slate-500">
              Pilih jenis bencana untuk menyesuaikan panduan keselamatan awal sesuai ancaman yang dihadapi.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-white text-slate-600 rounded-xl border border-slate-200 shadow-2xs">
            6 Skenario Siaga
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {HAZARD_TYPES.map((item) => {
            const isSelected = selectedQuickHazard === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleHazardClick(item)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer group hover-lift relative ${
                  isSelected 
                    ? 'bg-blue-50/90 border-[#2196F3] shadow-md shadow-blue-500/10 ring-2 ring-[#2196F3]' 
                    : 'bg-white border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/70 shadow-2xs'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
                  isSelected 
                    ? 'bg-[#0D47A1] text-white shadow-sm' 
                    : item.id === 'banjir' ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : item.id === 'gempa' ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : item.id === 'kebakaran' ? 'bg-orange-50 text-orange-600 border border-orange-100'
                    : item.id === 'longsor' ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : item.id === 'erupsi' ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {item.id === 'banjir' && <Waves className="w-6 h-6" />}
                  {item.id === 'gempa' && <Activity className="w-6 h-6" />}
                  {item.id === 'kebakaran' && <Flame className="w-6 h-6" />}
                  {item.id === 'longsor' && <Mountain className="w-6 h-6" />}
                  {item.id === 'erupsi' && <Mountain className="w-6 h-6" />}
                  {item.id === 'lainnya' && <HelpCircle className="w-6 h-6" />}
                </div>

                <span className={`text-xs sm:text-sm font-extrabold ${isSelected ? 'text-[#0D47A1]' : 'text-slate-800'}`}>
                  {item.label}
                </span>

                <span className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                  {item.desc}
                </span>

                {isSelected && (
                  <span className="mt-2 text-[10px] font-black uppercase text-[#0D47A1] bg-white border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3 text-blue-600 stroke-[3]" /> Dipilih
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Access Bento Grid - 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Tile 1: Family Safety */}
        <button 
          type="button"
          onClick={() => onNavigateScreen('family')}
          className="group text-left p-6 bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 shadow-sm hover-lift cursor-pointer flex flex-col justify-between transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Tanpa Pulsa
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                Family Safety Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Pantau kesiapan lansia, balita, dan kerabat dengan kebutuhan khusus lewat check-in manual cepat [Aman / Butuh Bantuan].
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Kelola Anggota Keluarga</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Tile 2: Safe Route */}
        <button
          type="button"
          onClick={() => onNavigateScreen('route')}
          className="group text-left p-6 bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 shadow-sm hover-lift cursor-pointer flex flex-col justify-between transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0D47A1] border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Navigation className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Rute Jalan Riil
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-[#0D47A1] transition-colors">
                Rute Aman & Posko Evakuasi
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Arahkan rute jalan riil OpenStreetMap menuju posko terverifikasi yang menghindari genangan banjir dan jembatan rusak.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0D47A1]">
            <span>Lihat Posko & Peta Rute</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Tile 3: Emergency Checklist */}
        <button
          type="button"
          onClick={() => onNavigateScreen('checklist')}
          className="group text-left p-6 bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 shadow-sm hover-lift cursor-pointer flex flex-col justify-between transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Tas Siaga 72 Jam
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-amber-800 transition-colors">
                Tas Siaga & Checklist Darurat
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Kelola perbekalan darurat mandiri: air minum, obat-obatan rutin, peluit, dan dokumen penting terbungkus kedap air.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-800">
            <span>Periksa Kelengkapan Tas</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Tile 4: Global Safety Map & SAR Radar */}
        <button
          type="button"
          onClick={() => onNavigateScreen('safety_map')}
          className="group text-left p-6 bg-white rounded-3xl border border-slate-200/90 hover:border-rose-400 shadow-sm hover-lift cursor-pointer flex flex-col justify-between transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Radar Lapangan
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-rose-700 transition-colors">
                Radar Komunitas & Triase SAR
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Pantau zona bahaya terverifikasi, radius dampak, dan hubungkan sinyal minta tolong langsung ke regu penolong.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
            <span>Buka Radar Komunitas</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Akses Offline & Cache Materi Card */}
      <section className="rounded-3xl border border-blue-200/90 bg-white/95 backdrop-blur-md p-5 sm:p-7 shadow-xs sm:flex sm:items-center sm:justify-between sm:gap-6 hover-lift">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              <DownloadCloud className="w-3.5 h-3.5" />
              Kesiapan Offline
            </span>
            <span className="text-xs text-slate-500 font-semibold">• Tersimpan di Browser</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            Simpan aplikasi & materi panduan untuk kondisi BTS padam
          </h2>
          <p className="text-xs leading-relaxed text-slate-500 max-w-2xl">
            Panduan 1-langkah dan checklist kebutuhan darurat tetap dapat diakses meskipun sinyal internet padam total.
          </p>
          {offlineMessage && <p role="status" className="text-xs font-bold text-emerald-800 pt-1">{offlineMessage}</p>}
          {offlineState === 'unsupported' && <p role="status" className="text-xs text-amber-800 pt-1">Browser ini belum mendukung penyimpanan offline otomatis.</p>}
        </div>

        <button
          type="button"
          onClick={handlePrepareOffline}
          disabled={offlineState === 'saving' || offlineState === 'checking'}
          className="mt-4 sm:mt-0 inline-flex min-h-12 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0D47A1] hover:bg-[#1565C0] px-5 py-3 text-xs font-extrabold text-white transition-all shadow-md hover:scale-102 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
        >
          <DownloadCloud className="w-4 h-4" />
          <span>{offlineState === 'saving' ? 'Menyimpan…' : offlineState === 'saved' ? 'Perbarui Cache Offline' : 'Unduh Materi Offline'}</span>
        </button>
      </section>

      {/* Official Transparency Card */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Rujukan Sumber Data Resmi Kemanusiaan</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Integrasi Protokol Siaga
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OFFICIAL_SOURCES.map((src, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs hover:border-blue-300 transition-colors">
              <div>
                <p className="font-extrabold text-[#0D47A1] text-xs">{src.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{src.update}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md">
                REFERENSI
              </span>
            </div>
          ))}
        </div>
      </div>

      <SignalBeaconModal 
        isOpen={isBeaconOpen} 
        onClose={() => setIsBeaconOpen(false)} 
      />
    </div>
  );
}
