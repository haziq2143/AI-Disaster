'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  MapPin, 
  Users, 
  Radio, 
  PhoneCall, 
  CheckCircle2, 
  Activity, 
  Sparkles, 
  Compass, 
  Flame, 
  Waves, 
  Layers, 
  ChevronRight, 
  ShieldAlert, 
  HelpCircle, 
  ChevronDown, 
  Navigation, 
  BellRing, 
  HeartHandshake, 
  Check, 
  Zap, 
  Globe2, 
  Clock3,
  ArrowUp,
  RotateCcw,
  CheckSquare,
  Play,
  BarChart3,
  Smartphone,
  Shield,
  ExternalLink,
  Wifi,
  Battery,
  Signal,
  CheckCircle,
  Volume2
} from 'lucide-react';
import GuardianShieldLogo from './GuardianShieldLogo';
import ScrollReveal from './ScrollReveal';

export default function LandingPage({ onEnterApp, onQuickExplore, onLoginClick, onRegisterClick, onSarDemoClick }) {
  const [activeRole, setActiveRole] = useState('warga'); // 'warga' | 'sar' | 'family'
  const [activeSimDisaster, setActiveSimDisaster] = useState('gempa'); // 'gempa' | 'banjir' | 'longsor'
  const [openFaq, setOpenFaq] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [readinessAnswers, setReadinessAnswers] = useState({ bag: true, point: false, card: true });
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset checked simulation steps when disaster changes
  useEffect(() => {
    setCheckedSteps({});
  }, [activeSimDisaster]);

  const toggleSimStep = (idx) => {
    setCheckedSteps(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleReadiness = (key) => {
    setReadinessAnswers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const readinessScore = Math.round(
    (((readinessAnswers.bag ? 1 : 0) + (readinessAnswers.point ? 1 : 0) + (readinessAnswers.card ? 1 : 0)) / 3) * 100
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSimulation = () => {
    const el = document.getElementById('simulasi-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Dynamic simulation steps
  const simulationData = {
    gempa: {
      title: 'Gempa Bumi 6.2 SR Terdeteksi',
      color: 'rose',
      steps: [
        'Lindungi kepala di bawah meja kokoh / Drop, Cover, Hold On',
        'Jauhi jendela kaca, lemari tinggi, dan instalasi listrik retak',
        'Matikan kompor dan sakelar meteran listrik sebelum evakuasi keluar',
        'Bergerak ke tanah lapang / titik kumpul RT terdekat'
      ],
      hazardNote: 'Waspada potensi gempa susulan dalam 1-2 jam ke depan.'
    },
    banjir: {
      title: 'Banjir Luapan Sungai Citarum (1.2 M)',
      color: 'blue',
      steps: [
        'Segera amankan barang berharga dan dokumen ke lantai atas',
        'Matikan MCB aliran listrik rumah untuk mencegah sengatan arus air',
        'Jangan pernah menyeberang genangan air dengan arus berputar',
        'Ikuti rute evakuasi bebas genangan menuju Posko Balai Desa'
      ],
      hazardNote: 'Arus deras menyembunyikan lubang selokan dan kabel listrik terbuka.'
    },
    longsor: {
      title: 'Pergerakan Tanah & Longsor Tebing',
      color: 'amber',
      steps: [
        'Evakuasi tegak lurus menjauhi lereng bukit / aliran lumpur',
        'Dengarkan gemuruh atau retakan pepohonan sebagai tanda awal',
        'Bantu lansia dan anak kecil bergerak ke kontur tanah yang stabil',
        'Kirimkan sinyal koordinat akurat ke regu SAR setempat'
      ],
      hazardNote: 'Hujan lebat mempercepat kejenuhan air di lereng terjal.'
    }
  };

  const faqs = [
    {
      q: 'Apakah Evacu8 memerlukan koneksi internet untuk bekerja saat darurat?',
      a: 'Tidak seluruhnya. Saat jaringan internet lumpuh, fitur darurat kunci seperti Kartu Identitas Medis, Sinyal Peluit Audio 3.000 Hz, Strobo Layar, dan Fallback SMS/WhatsApp tetap dapat bekerja langsung dari memori perangkat (Local Offline Cache).'
    },
    {
      q: 'Apa itu sistem PASS (Personal Alert Safety System) untuk Tim SAR?',
      a: 'PASS adalah detektor otomatis korban terjebak. Di zona bencana level kritis (Level 3 - AWAS), jika ponsel warga tidak berpindah posisi selama 1 jam, sistem otomatis mengaktifkan sinyal peluit peringatan dan menandai lokasinya di radar SAR sebagai korban yang butuh pertolongan segera.'
    },
    {
      q: 'Bagaimana cara Tim SAR menentukan titik evakuasi dan rute aman?',
      a: 'Tim SAR memiliki dashboard khusus dengan Peta Operasi Terpadu. Tim SAR dapat langsung mengunci koordinat fisik GPS di lapangan dengan 1 klik, menetapkan batas radius bahaya, dan memantau kapasitas pengungsi di setiap posko secara real-time.'
    },
    {
      q: 'Apakah aplikasi ini gratis untuk seluruh warga Indonesia?',
      a: 'Ya, Evacu8 adalah platform sosial terbuka yang dirancang tanpa iklan, tanpa biaya langganan, dan dapat diakses langsung oleh masyarakat luas maupun relawan kemanusiaan.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Subtle Nexora Blueprint Background Grid */}
      <div className="absolute inset-0 nexora-grid pointer-events-none -z-10" />

      {/* TOP NAVBAR (Nexora Clean Style) */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 transition-all animate-fadeInDown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onEnterApp}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] via-[#2563EB] to-[#60A5FA] p-0.5 shadow-md shadow-blue-600/15 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <GuardianShieldLogo size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Evacu8</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Respon Cepat
              </span>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button onClick={scrollToSimulation} className="hover:text-blue-600 transition-colors cursor-pointer">
              Simulasi Bencana
            </button>
            <a href="#fitur" className="hover:text-blue-600 transition-colors">
              Fitur Siaga
            </a>
            <a href="#peran" className="hover:text-blue-600 transition-colors">
              Tiga Perspektif
            </a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Nav Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onSarDemoClick}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs hover-lift"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Masuk Cepat SAR</span>
            </button>

            <button
              type="button"
              onClick={onLoginClick}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Masuk
            </button>

            <button
              type="button"
              onClick={onEnterApp}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-600/25 hover:shadow-lg transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5"
            >
              <span>Buka Aplikasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Nexora Split Layout with 3D Fan Cascading Cards) */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 animate-fadeInUp delay-100">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Sistem Tanggap Bencana 1-Langkah
              </span>
            </div>

            {/* Nexora Style High-Contrast Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12] animate-fadeInUp delay-200">
              Panduan tepat untuk <br />
              <span className="text-[#2563EB]">keselamatan nyata</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl animate-fadeInUp delay-300 font-normal">
              Evacu8 memandu warga mengambil tindakan penyelamatan satu per satu tanpa panik, menjaga koordinasi keluarga saat sinyal lemah, dan menghubungkan posko SAR langsung ke titik korban.
            </p>

            {/* CTA Buttons (Nexora Style) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 animate-fadeInUp delay-400">
              <button
                type="button"
                onClick={onEnterApp}
                className="px-6 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer group"
              >
                <span>Mulai Evakuasi (Mode Tamu)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={scrollToSimulation}
                className="px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm sm:text-base transition-all hover:border-slate-300 cursor-pointer flex items-center justify-center gap-2 shadow-2xs hover-lift"
              >
                <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span>Coba Simulasi Cepat</span>
              </button>
            </div>

            {/* Social Proof / Trust Strip */}
            <div className="pt-6 border-t border-slate-200/80 flex items-center gap-4 animate-fadeInUp delay-500">
              <div className="flex -space-x-2 overflow-hidden">
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">B</span>
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">S</span>
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">A</span>
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">R</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Dipercaya ribuan keluarga & relawan kemanusiaan di Indonesia.
              </p>
            </div>
          </div>

          {/* Right Hero Graphic: Nexora-Style Cascading 3D Glass Cards */}
          <div className="lg:col-span-6 relative flex items-center justify-center perspective-1200 py-6 lg:py-0">
            {/* Ambient Background Aura behind cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Fan of 4 Cascading Layered Perspective Cards */}
            <div className="relative w-full max-w-[460px] h-[360px] sm:h-[420px] flex items-center justify-center">
              
              {/* Card 4 (Deepest Layer): Radar Tim SAR */}
              <div className="absolute w-[280px] sm:w-[320px] h-[220px] sm:h-[240px] rounded-3xl bg-[#0B2545] text-white p-5 shadow-2xl border border-white/20 card-fan-1 hover:rotate-[-8deg] transition-all duration-300">
                <div className="flex items-center justify-between text-xs text-blue-200 border-b border-white/10 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="font-extrabold">Radar SAR Lapangan</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Live GPS</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Zonasi bahaya terverifikasi & dispatch regu evakuasi 12 menit tiba.
                </p>
              </div>

              {/* Card 3 (Layer 3): Rute Jalan Riil OSRM */}
              <div className="absolute w-[280px] sm:w-[320px] h-[220px] sm:h-[240px] rounded-3xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] text-white p-5 shadow-2xl border border-white/30 card-fan-2 hover:rotate-[-3deg] transition-all duration-300">
                <div className="flex items-center justify-between text-xs text-white border-b border-white/15 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-200" />
                    <span className="font-extrabold">Rute Bebas Banjir</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">OSRM</span>
                </div>
                <p className="text-xs text-blue-50 font-medium leading-relaxed">
                  Menghindari jembatan rusak dan genangan menuju Posko Balai Desa.
                </p>
              </div>

              {/* Card 2 (Layer 2): Sinyal Peluit Akustik 3.000 Hz */}
              <div className="absolute w-[280px] sm:w-[320px] h-[220px] sm:h-[240px] rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] text-white p-5 shadow-2xl border border-white/40 card-fan-3 hover:translate-y-[-5px] transition-all duration-300">
                <div className="flex items-center justify-between text-xs text-white border-b border-white/20 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-white animate-pulse" />
                    <span className="font-extrabold">Beacon Peluit 3.000 Hz</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">SOS</span>
                </div>
                <p className="text-xs text-white font-medium leading-relaxed">
                  Frekuensi akustik tembus puing untuk didengar anjing pelacak K9 SAR.
                </p>
              </div>

              {/* Card 1 (Top Hero Glass Card): 1-Langkah Panduan */}
              <div className="absolute w-[290px] sm:w-[330px] h-[210px] sm:h-[230px] rounded-3xl bg-white/95 backdrop-blur-xl text-slate-900 p-5 shadow-2xl shadow-blue-900/15 border border-slate-200/90 translate-y-12 sm:translate-y-14 transition-all duration-300 hover:scale-102">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-extrabold text-slate-900">Langkah 1 dari 4</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                    Aktif
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                  Lindungi kepala di bawah meja kokoh / Drop, Cover, Hold On
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-semibold">Tindakan Cepat</span>
                  <span className="px-3 py-1 bg-[#2563EB] text-white rounded-lg font-bold text-[11px]">
                    ✓ Selesai, Lanjut
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* HUMANITARIAN PARTNERS RIBBON (Nexora Logo Cloud) */}
      <section className="py-10 border-y border-slate-150 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-600 mb-6">
            Protokol Selaras Standar Lembaga Kebencanaan & Pemetaan Resmi
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-center text-center">
            <div className="flex items-center justify-center gap-2 font-black text-slate-700 text-sm tracking-tight opacity-90 hover:opacity-100 transition-opacity">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>BNPB</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-black text-slate-700 text-sm tracking-tight opacity-90 hover:opacity-100 transition-opacity">
              <Radio className="w-4 h-4 text-rose-600" />
              <span>BASARNAS</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-black text-slate-700 text-sm tracking-tight opacity-90 hover:opacity-100 transition-opacity">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>BMKG</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-black text-slate-700 text-sm tracking-tight opacity-90 hover:opacity-100 transition-opacity">
              <HeartHandshake className="w-4 h-4 text-red-600" />
              <span>PMI</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-black text-slate-700 text-sm tracking-tight opacity-90 hover:opacity-100 transition-opacity">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>OpenStreetMap</span>
            </div>
            <div className="flex items-center justify-center gap-2 font-black text-slate-700 text-sm tracking-tight opacity-90 hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Kemenkes RI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ASYMMETRIC FEATURE GRID (Nexora "A Smarter Way to Work" -> Evacu8 Features) */}
      <section id="fitur" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Feature Column: Big Intro Card */}
          <div className="lg:col-span-3 flex flex-col justify-between text-left p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Pendekatan lebih cerdas untuk evakuasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                Semua instrumen keselamatan yang Anda butuhkan saat menghadapi situasi darurat tanpa kebingungan teks panjang.
              </p>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={onEnterApp}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group"
              >
                <span>Jelajahi semua fitur</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Feature Column: 3 White Nexora Style Cards */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Card 1: 1-Step Guidance */}
            <ScrollReveal direction="up" delay={50}>
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover-lift flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Instruksi 1-Langkah
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Menghilangkan teks panjang saat kognitif menurun drastis akibat stres panik. Panduan disajikan satu per satu.
                  </p>
                </div>
                <div className="pt-5 mt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span>Pelajari alur</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2: Family Safety */}
            <ScrollReveal direction="up" delay={120}>
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover-lift flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Family Safety Tanpa Pulsa
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Pantau lansia berkursi roda & balita dengan check-in manual berdaya rendah saat BTS padam atau sinyal padat.
                  </p>
                </div>
                <div className="pt-5 mt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span>Pelajari alur</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3: SAR Operations */}
            <ScrollReveal direction="up" delay={190}>
              <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover-lift flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Radar Terpadu Tim SAR
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Kunci GPS fisik 1-tap, slider radius zonasi bahaya, dan monitoring kapasitas jiwa di posko pengungsian.
                  </p>
                </div>
                <div className="pt-5 mt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span>Pelajari alur</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* STAT METRICS BANNER (Nexora 4-Column Metric Strip) */}
      <section className="py-16 border-y border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            <ScrollReveal direction="up" delay={0}>
              <div className="space-y-1">
                <p className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">1 Detik</p>
                <p className="text-xs sm:text-sm font-bold text-blue-600">Respon Panduan Awal</p>
                <p className="text-xs text-slate-600">Instruksi pertama muncul instan tanpa buffering</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={80}>
              <div className="space-y-1">
                <p className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">3.000 Hz</p>
                <p className="text-xs sm:text-sm font-bold text-blue-600">Frekuensi Penetrasi Puing</p>
                <p className="text-xs text-slate-600">Sinyal akustik optimal pendengaran regu K9 SAR</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={160}>
              <div className="space-y-1">
                <p className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">100%</p>
                <p className="text-xs sm:text-sm font-bold text-blue-600">Kesiapan Offline Penuh</p>
                <p className="text-xs text-slate-600">Berfungsi dari memori perangkat saat BTS padam</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={240}>
              <div className="space-y-1">
                <p className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">0 Ribet</p>
                <p className="text-xs sm:text-sm font-bold text-blue-600">Kunci GPS Fisik 1-Tap</p>
                <p className="text-xs text-slate-600">Tanpa repot ketik manual latitude & longitude</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* MOBILE SHOWCASE (Nexora Hand-Held Phone / Workspace in Your Hands) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column with ScrollReveal */}
          <div className="lg:col-span-6 text-left">
            <ScrollReveal direction="left" delay={50} className="space-y-6">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Aplikasi Tanggap Darurat Mobile</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-[1.15]">
                Penyelamat darurat <br />
                <span className="text-[#2563EB]">dalam saku Anda</span>
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg font-normal">
                Bekerja di mana saja bahkan saat listrik padam total. Kartu identitas medis darurat dan sinyal peluit tersimpan permanen di memori browser HP Anda tanpa harus mengunduh aplikasi berat dari PlayStore.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover-lift transition-transform">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Web App (PWA) Siap Pasang</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs hover-lift transition-transform">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Akses Offline Mandiri</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Phone Mockup with Floating Tooltip Chips & Entrance Animation */}
          <div className="lg:col-span-6 relative flex items-center justify-center py-6">
            <ScrollReveal direction="right" delay={150} className="relative flex items-center justify-center w-full">
              {/* Ambient Breathing Back Glow */}
              <div className="absolute w-80 h-96 bg-gradient-to-tr from-blue-400/30 to-indigo-300/30 rounded-full blur-3xl pointer-events-none animate-pulseSoft" />

              {/* Floating Smartphone Mockup Frame */}
              <div 
                className="relative w-full max-w-[360px] sm:max-w-[390px] bg-slate-950 rounded-[52px] p-3.5 shadow-[0_35px_100px_-20px_rgba(15,23,42,0.45)] border-[6px] border-slate-900 ring-1 ring-white/10 transition-all duration-500 hover:scale-[1.02] hover:-rotate-1"
                style={{ animation: 'floatSlow 6s ease-in-out infinite' }}
              >
                
                {/* Dynamic Island Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-end pr-2.5 space-x-1.5 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Phone Screen Container */}
                <div className="bg-slate-50 rounded-[42px] pt-8 pb-5 px-4 text-left space-y-3.5 overflow-hidden relative border border-slate-200/80 shadow-inner">
                  
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 px-2 pt-1 pb-1">
                    <span>09:41</span>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Signal className="w-3 h-3" />
                      <Wifi className="w-3 h-3" />
                      <Battery className="w-3.5 h-3.5 text-slate-800 fill-slate-800" />
                    </div>
                  </div>

                  {/* In-App Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                        <GuardianShieldLogo size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 leading-tight">Evacu8</p>
                        <p className="text-[9px] font-semibold text-slate-500">Sistem Tanggap Bencana</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                      SIAGA 1
                    </span>
                  </div>

                  {/* Progress Step Bar */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-blue-600 uppercase tracking-wider text-[10px]">
                        Langkah Siaga Terdekat
                      </span>
                      <span className="font-bold text-slate-500 text-[10px]">1 dari 3 Langkah</span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#2563EB] h-full w-1/3 rounded-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/40 animate-pulse" />
                      </div>
                    </div>

                    <p className="text-xs font-black text-slate-900 leading-snug pt-1">
                      Matikan sakelar meteran MCB listrik rumah sebelum mengungsi
                    </p>

                    <button type="button" className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Konfirmasi Langkah Selesai</span>
                    </button>
                  </div>

                  {/* Family Status Tracker */}
                  <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Family Safety (Tanpa Pulsa)
                      </span>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        2 Terhubung
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/70">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                            IS
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-[11px] leading-tight">Ibu Siti & Balita</p>
                            <p className="text-[9px] text-emerald-700">Sudah di Posko Desa</p>
                          </div>
                        </div>
                        <span className="text-emerald-700 font-black text-[11px]">Aman ✓</span>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                            KH
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-[11px] leading-tight">Kakek Harun</p>
                            <p className="text-[9px] text-slate-500">Menuju Titik Kumpul (250m)</p>
                          </div>
                        </div>
                        <span className="text-blue-700 font-bold text-[10px]">OTW Posko</span>
                      </div>
                    </div>
                  </div>

                  {/* Acoustic Whistle Banner */}
                  <div className="bg-gradient-to-r from-rose-500 to-red-600 rounded-2xl p-3 text-white shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center relative">
                        <span className="absolute inset-0 rounded-xl bg-white/30 animate-ping" style={{ animationDuration: '2s' }} />
                        <Radio className="w-4 h-4 text-white relative z-10" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black leading-tight">Peluit Darurat 3.000 Hz</p>
                        <p className="text-[9px] text-rose-100">Menembus puing saat tertimbun</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 bg-white text-rose-600 rounded-lg text-[10px] font-black shadow-xs">
                      SIAP
                    </div>
                  </div>

                  {/* Bottom App Navigation Dock */}
                  <div className="pt-2 flex items-center justify-around border-t border-slate-200 text-slate-400">
                    <div className="flex flex-col items-center gap-0.5 text-blue-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span className="text-[9px] font-extrabold">Beranda</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-semibold">Peta</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-semibold">Keluarga</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-semibold">Peluit</span>
                    </div>
                  </div>

                </div>

                {/* Floating Pill Chip 1 (Top Left) */}
                <div 
                  className="absolute -top-4 -left-4 sm:-left-8 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 shadow-xl text-xs font-bold text-slate-800 flex items-center gap-2.5 transition-transform hover:scale-105 z-20"
                  style={{ animation: 'floatSlow 4.5s ease-in-out infinite', animationDelay: '0.2s' }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                  <Radio className="w-4 h-4 text-rose-600" />
                  <span className="whitespace-nowrap">Peluit SOS 3.000 Hz Siap</span>
                </div>

                {/* Floating Pill Chip 2 (Top Right) */}
                <div 
                  className="absolute top-14 -right-4 sm:-right-8 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 shadow-xl text-xs font-bold text-slate-800 flex items-center gap-2.5 transition-transform hover:scale-105 z-20"
                  style={{ animation: 'floatSlow 5.2s ease-in-out infinite', animationDelay: '1.2s' }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                  </span>
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="whitespace-nowrap">Rute OSRM Terhindar Banjir</span>
                </div>

                {/* Floating Pill Chip 3 (Bottom Right) */}
                <div 
                  className="absolute -bottom-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 shadow-xl text-xs font-bold text-slate-800 flex items-center gap-2.5 transition-transform hover:scale-105 z-20"
                  style={{ animation: 'floatSlow 4.8s ease-in-out infinite', animationDelay: '2.4s' }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="whitespace-nowrap">Posko Balai Desa · 450m</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* INTERACTIVE SIMULATION SANDBOX (Warga bisa coba alur bencana langsung) */}
      <section id="simulasi-section" className="py-24 bg-slate-50/70 border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up" delay={50}>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full">
                Simulasi Interaktif
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-3 tracking-tight">
                Coba Cara Kerja Panduan 1-Langkah
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-2">
                Pilih jenis bencana di bawah dan klik setiap langkah untuk mencoba pengalaman interaktif warga saat evakuasi.
              </p>

              {/* Disaster Type Pills */}
              <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveSimDisaster('gempa')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSimDisaster === 'gempa'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-102'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Gempa Bumi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSimDisaster('banjir')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSimDisaster === 'banjir'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>Banjir Bandang</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSimDisaster('longsor')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSimDisaster === 'longsor'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-102'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Tanah Longsor</span>
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Interactive Simulation Sandbox Card */}
          <ScrollReveal direction="scale" delay={150}>
            <div 
              key={activeSimDisaster} 
              className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-xl shadow-blue-900/5 animate-scaleIn hover-lift"
            >
              <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {simulationData[activeSimDisaster].title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Selesai: {Object.values(checkedSteps).filter(Boolean).length} / {simulationData[activeSimDisaster].steps.length}
                  </span>
                  {Object.values(checkedSteps).some(Boolean) && (
                    <button
                      type="button"
                      onClick={() => setCheckedSteps({})}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                      title="Reset langkah"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {simulationData[activeSimDisaster].steps.map((step, idx) => {
                  const isDone = Boolean(checkedSteps[idx]);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleSimStep(idx)}
                      role="button"
                      tabIndex={0}
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isDone 
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs translate-x-1' 
                          : 'bg-slate-50/70 border-slate-200 text-slate-800 shadow-2xs hover:border-blue-300 hover:bg-white'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isDone ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-[#2563EB]'
                      }`}>
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs sm:text-sm font-bold leading-snug ${isDone ? 'line-through opacity-80' : ''}`}>
                          {step}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {isDone ? 'Langkah telah dikonfirmasi selesai' : 'Klik untuk menandai telah dilakukan'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Catatan Lapangan:</strong> {simulationData[activeSimDisaster].hazardNote}</span>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-150">
                <span className="text-xs text-slate-500 font-semibold">Ingin mencoba skenario sebenarnya?</span>
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-102"
                >
                  <span>Buka Alur Evakuasi Penuh</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* THREE PERSPECTIVES SECTION */}
      <section id="peran" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal direction="up" delay={50}>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-sky-100 text-[#2563EB] rounded-full">
              Tiga Sudut Pandang Lapangan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-3 tracking-tight">
              Satu Ekosistem untuk Semua Pihak
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-2">
              Pelajari bagaimana Evacu8 membantu warga di rumah, regu penyelamat di lapangan, dan sanak famili di perantauan.
            </p>

            {/* Perspective Tabs */}
            <div className="flex justify-center mt-6">
              <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveRole('warga')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeRole === 'warga'
                      ? 'bg-white text-[#2563EB] shadow-md scale-102'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Warga Terjebak
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRole('sar')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeRole === 'sar'
                      ? 'bg-rose-600 text-white shadow-md scale-102'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Regu Penyelamat SAR
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRole('family')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeRole === 'family'
                      ? 'bg-emerald-600 text-white shadow-md scale-102'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Keluarga & Kerabat
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Perspective Detail Cards */}
        <ScrollReveal direction="scale" delay={150}>
          <div key={activeRole} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg shadow-slate-200/50 animate-fadeInUp hover-lift">
            {activeRole === 'warga' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fadeIn">
                <div className="space-y-4 text-left">
                  <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
                    Fokus Warga & Korban
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Instruksi Singkat Saat Kognitif Melemah Karena Panik
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Stres akut saat bencana menurunkan kemampuan membaca teks panjang. Evacu8 menyajikan instruksi satu demi satu berukuran besar, dilengkapi suara panduan Bahasa Indonesia dan fallback SMS ketika kuota habis.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tombol konfirmasi satu tap untuk berpindah ke langkah selanjutnya.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Beacon suara 3.000 Hz & strobo senter untuk korban yang tertindih reruntuhan.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Saluran darurat langsung ke hotline SAR 112 / BNPB.</span>
                    </div>
                  </div>
                </div>

                {/* Visual Card Mock */}
                <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-rose-600">Mode Darurat</span>
                    <span className="text-slate-400">Tampilan Ponsel</span>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Langkah 1</p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">
                      Jangan mencoba menyalakan korek api / kompor bila tercium bau gas
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button type="button" className="p-3 bg-[#2563EB] text-white font-bold rounded-xl text-center shadow-xs">
                      ✓ Selesai, Lanjut
                    </button>
                    <button type="button" className="p-3 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl text-center">
                      Lihat Alternatif
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeRole === 'sar' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fadeIn">
                <div className="space-y-4 text-left">
                  <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider bg-rose-50 px-2.5 py-1 rounded-md">
                    Fokus Petugas Lapangan
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Pusat Operasi Terpadu Tanpa Hambatan Koordinat
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Tim SAR di lapangan tidak perlu lagi sibuk menyalin angka Latitude & Longitude manual. Cukup 1 klik untuk mengunci GPS fisik, menentukan zona bahaya dengan slider radius visual, dan memperbarui kapasitas jiwa di posko.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Sistem PASS: Otomatis mendeteksi warga tak bergerak &gt; 1 jam di zona kritis.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Status Siar OTW: Korban melihat estimasi waktu tiba regu penolong di ponselnya.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pengelolaan kapasitas pengungsi posko secara transparan.</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onSarDemoClick}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md hover-lift"
                    >
                      <span>Coba Demo Tim SAR Sekarang</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Visual Card Mock */}
                <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#2563EB]">Radar Triase Lapangan</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">GPS Terkunci</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Ibu Siti & Balita (Terjebak)</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded">KRITIS</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Air sudah setinggi 80 cm, menunggu evakuasi perahu karet.</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                    <span>Regu SAR Alpha 01</span>
                    <span className="font-extrabold text-[#2563EB]">OTW · Tiba dalam 12 Menit</span>
                  </div>
                </div>
              </div>
            )}

            {activeRole === 'family' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fadeIn">
                <div className="space-y-4 text-left">
                  <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md">
                    Fokus Komunikasi Keluarga
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Kepastian Keberadaan Sanak Saudara Saat Jaringan Sibuk
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Saat bencana, panggilan telepon sering terputus karena lonjakan jaringan. Evacu8 menyediakan check-in berdaya rendah [Aman / Butuh Bantuan / Belum Tahu] yang otomatis tersinkron saat ada secuil sinyal internet atau SMS.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Catatan kebutuhan khusus anggota: obat hipertensi, kursi roda, atau susu bayi.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Arahkan rute evakuasi langsung ke titik penjemputan anggota keluarga.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Simpan kartu identitas darurat offline di browser tanpa login ulang.</span>
                    </div>
                  </div>
                </div>

                {/* Visual Card Mock */}
                <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-700">Pemantauan Keluarga</span>
                    <span className="text-slate-500 text-[11px]">3 dari 3 Check-in</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Ibu Ratna (Lansia)</p>
                      <p className="text-[10px] text-slate-500">Kebutuhan: Bantuan kursi roda</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg">Saya Aman</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Arka (Anak 5 tahun)</p>
                      <p className="text-[10px] text-slate-500">Bersama Ibu di rumah</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg">Saya Aman</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-24 bg-slate-50/70 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="up" delay={50}>
            <div className="text-center mb-12">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full">
                Tanya Jawab (FAQ)
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-3 tracking-tight">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Informasi penting mengenai operasional dan privasi data keselamatan warga.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <ScrollReveal key={index} direction="up" delay={index * 80}>
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs hover-lift">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="w-full p-4 sm:p-5 text-left font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fadeInQuick">
                        {faq.a}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION (Nexora Split CTA Banner) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ScrollReveal direction="scale" delay={100}>
          <div className="rounded-[32px] sm:rounded-[36px] bg-slate-900 text-white p-8 sm:p-14 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Ambient Back Glow */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 text-left max-w-xl">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                Kesiapsiagaan Cepat
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Ubah kecemasan jadi <br />
                <span className="text-[#60A5FA]">kesiapsiagaan nyata</span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-base leading-relaxed pt-1">
                Tidak perlu menunggu alarm berbunyi. Simpan rute evakuasi, data medis, dan bagikan kode keluarga Anda hari ini.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={onEnterApp}
                className="px-7 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Buka Aplikasi Langsung</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onRegisterClick}
                className="px-7 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                Daftar Akun Baru
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <GuardianShieldLogo size={20} />
            <span className="font-extrabold text-slate-900 text-sm">Evacu8</span>
            <span className="text-slate-300">|</span>
            <span>Platform Panduan Bencana & Evakuasi Cepat Terpadu</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Bukan pengganti layanan darurat resmi BNPB 112 / Basarnas 115.
          </p>
        </div>
      </footer>

      {/* Floating Scroll To Top & Quick Launch Pill */}
      {showScrollTop && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-white text-slate-800 border border-slate-200 shadow-lg hover:bg-slate-50 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Kembali ke atas"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4 text-blue-600" />
          </button>
          <button
            type="button"
            onClick={onEnterApp}
            className="px-4 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          >
            <span>Buka Aplikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
