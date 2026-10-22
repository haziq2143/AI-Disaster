'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Info,
  Footprints,
  Compass,
  PhoneCall,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Users,
  ShieldAlert,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';
import { INITIAL_EVACUATION_POINTS } from '../data/mockData';
import { useGeolocation } from '../hooks/useGeolocation';

// Fallback emergency reports & family data for route planning
const INITIAL_EMERGENCY_PEOPLE = [
  {
    id: 'rep-sos-1',
    name: 'Ibu Siti & Balita (Butuh Bantuan)',
    category: 'darurat',
    distance: '890 meter',
    estTime: '11-13 menit',
    status: 'BUTUH BANTUAN SEGERA',
    urgency: 'KRITIS',
    elevation: 'Dataran rendah (+12m mdpl)',
    notes: 'Air genangan di rumah mencapai 60 cm dan terus mengalir deras. Ibu dan balita terjebak di atas meja tinggi. Butuh perahu karet segera!',
    needs: 'Perahu karet, pelampung balita, dan tandu lansia',
    contact: '0813-2233-4455 (Siti)',
    vulnerable: '1 Bayi/Balita (2 thn), 1 Lansia (68 thn)',
    navSteps: [
      { step: 1, title: 'Menuju Jalan Sukajadi Selatan', instruction: 'Mulai dari titik GPS Anda, melangkah ke selatan menuju Jalan Sukajadi (250m). Waspada genangan air di pinggir jalan.', danger: 'Arus air 25 cm di bahu jalan' },
      { step: 2, title: 'Masuki Gang Melati', instruction: 'Belok kiri ke Gang Melati. Gunakan tongkat untuk meraba lubang selokan. Ketinggian air meningkat hingga 50-60 cm.', danger: 'Kedalaman air 60 cm & lubang parit tak terlihat' },
      { step: 3, title: 'Tiba di Rumah Ibu Siti (No. 12)', instruction: 'Lokasi rumah nomor 12 di ujung gang kanan. Korban berada di lantai 2 / meja tinggi.', danger: 'Pagar besi licin, amankan balita terlebih dahulu' }
    ]
  },
  {
    id: 'rep-sos-2',
    name: 'Keluarga Bpk. Rahmat (Lansia Kursi Roda)',
    category: 'darurat',
    distance: '540 meter',
    estTime: '7-9 menit',
    status: 'BUTUH BANTUAN EVAKUASI',
    urgency: 'TINGGI',
    elevation: 'Dataran sedang (+14m mdpl)',
    notes: 'Tanggul selokan meluap setinggi 45 cm. Terdapat orang tua lansia yang harus memakai kursi roda, butuh bantuan tandu/papah fisik.',
    needs: 'Bantuan fisik memapah / tandu darurat & jas hujan',
    contact: '0878-9900-1122',
    vulnerable: '1 Lansia (76 thn, stroke ringan)',
    navSteps: [
      { step: 1, title: 'Bergerak ke Jalan Sukamulya', instruction: 'Melangkah ke arah barat melintasi trotoar kering Jalan Sukamulya (200m).', danger: 'Kabel listrik rendah menjuntai (hindari kontak)' },
      { step: 2, title: 'Ambil Jalur Kanan yang Lebih Tinggi', instruction: 'Belok kanan di pertigaan toko kelontong. Ambil sisi kanan jalan yang berpaving tinggi (220m).', danger: 'Sisi kiri jalan tergenang air 40 cm' },
      { step: 3, title: 'Tiba di Rumah Bpk. Rahmat (No. 22)', instruction: 'Rumah cat hijau di sisi kanan. Siapkan tandu darurat untuk mengevakuasi lansia kursi roda.', danger: 'Anak tangga teras licin' }
    ]
  }
];

const INITIAL_FAMILY_LOCATIONS = [
  {
    id: 'f2',
    name: 'Ibu Ratna (Orang Tua / Lansia)',
    category: 'keluarga',
    relationship: 'Orang Tua / Lansia',
    distance: '180 meter',
    estTime: '2-3 menit',
    status: 'BERSAMA DI RUMAH',
    urgency: 'PRIORITAS',
    elevation: 'Rumah Utama (+15m mdpl)',
    notes: 'Kondisi stabil tetapi membutuhkan kursi roda atau dipapah dua orang. Obat hipertensi rutin harus selalu dibawa.',
    needs: 'Kursi roda, payung besar, dan pendampingan fisik',
    vulnerable: 'Lansia (64 tahun, butuh kursi roda)',
    navSteps: [
      { step: 1, title: 'Menuju Ruang Kamar Utama', instruction: 'Masuki kamar tidur utama di lantai 1 dekat ruang tengah.', danger: 'Lantai teras licin akibat rembesan air' },
      { step: 2, title: 'Siapkan Kursi Roda & Tas Obat', instruction: 'Amankan tas ransel berisi obat amlodipine dan dokumen KK/KTP.', danger: 'Pastikan rem kursi roda terkunci saat memindahkan' },
      { step: 3, title: 'Papah Menuju Rute Evakuasi Kering', instruction: 'Bawa Ibu Ratna melewati pintu samping menuju jalan aspal kering.', danger: 'Arus selokan depan pekarangan' }
    ]
  },
  {
    id: 'f3',
    name: 'Arka (Anak Balita - 5 Tahun)',
    category: 'keluarga',
    relationship: 'Anak Balita',
    distance: '420 meter',
    estTime: '5-6 menit',
    status: 'LOKASI PAUD RW 04',
    urgency: 'PRIORITAS EVAKUASI',
    elevation: 'Dataran aman (+17m mdpl)',
    notes: 'Berada di ruang PAUD Mawar Ceria bersama guru pendamping. Perlu segera dijemput dan digendong rapat agar tidak panik.',
    needs: 'Gendongan dada / pundak, jas hujan anak, susu formula',
    vulnerable: 'Balita (5 tahun)',
    navSteps: [
      { step: 1, title: 'Berjalan Cepat ke Arah PAUD Mawar', instruction: 'Melangkah menyusuri trotoar timur Jalan Mawar (200m).', danger: 'Pohon rimbun rawan dahan patah' },
      { step: 2, title: 'Lewati Kantor Pos RW 04', instruction: 'Teruskan jalan lurus melewati kantor pos (120m). Jalur terpantau aman dan kering.', danger: 'Antrean warga evakuasi' },
      { step: 3, title: 'Tiba di Gedung PAUD Mawar', instruction: 'Masuk ke ruang guru lantai dasar. Gendong Arka di pundak atau dada menggunakan kain pengaman.', danger: 'Jangan biarkan anak berjalan sendiri di genangan' }
    ]
  }
];

export default function SafeRoute({ 
  hazardData, 
  familyMembers,
  navigationTarget,
  setNavigationTarget,
  onBack, 
  onNavigateScreen 
}) {
  const { coords: gpsCoords, accuracyText } = useGeolocation();
  
  // Category tabs: 'posko', 'keluarga', 'darurat'
  const [activeTab, setActiveTab] = useState(
    navigationTarget?.itemType === 'laporan_darurat'
      ? 'darurat'
      : navigationTarget?.itemType === 'warga' || navigationTarget?.category === 'keluarga'
        ? 'keluarga'
        : 'posko'
  );

  // Selected Target ID
  const [selectedPointId, setSelectedPointId] = useState(
    navigationTarget?.id || 'ev-1'
  );

  // Turn-by-Turn Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // If incoming navigationTarget updates from outside (e.g. from Global Safety Map click)
  useEffect(() => {
    if (navigationTarget) {
      if (navigationTarget.itemType === 'laporan_darurat') {
        setActiveTab('darurat');
      } else if (navigationTarget.itemType === 'warga' || navigationTarget.category === 'keluarga') {
        setActiveTab('keluarga');
      } else {
        setActiveTab('posko');
      }
      setSelectedPointId(navigationTarget.id);
      setIsNavigating(false);
      setCurrentStepIndex(0);
    }
  }, [navigationTarget]);

  // Posko Evacuation Points with Navigation Steps
  const poskoPoints = useMemo(() => {
    return INITIAL_EVACUATION_POINTS.map(p => {
      let navSteps = [
        { step: 1, title: 'Keluar Menuju Jalan Mawar', instruction: 'Melangkah keluar dari lokasi awal menuju Jalan Mawar arah utara (100 meter). Hindari sisi selokan yang tertutup genangan air.', danger: 'Potensi lubang selokan tak terlihat di air' },
        { step: 2, title: 'Belok di Pertigaan Pos Kamling', instruction: 'Belok kanan di pertigaan Pos Kamling RW 04 (150 meter). Jalur terpantau kering, berpenerangan, dan bebas dari genangan.', danger: 'Arus lalu lintas warga evakuasi' },
        { step: 3, title: `Tiba di ${p.name}`, instruction: `Lurus terus sejauh 100 meter hingga tiba di pintu gerbang utama. Titik aman dan tim medis berada di lantai dasar.`, danger: 'Kondisi tangga teras depan basah' }
      ];
      if (p.id === 'ev-2') {
        navSteps = [
          { step: 1, title: 'Menuju Jalan Protokol Sukamaju', instruction: 'Bergerak ke barat menuju Jalan Protokol (400m).', danger: 'Jalan protokol padat merayap armada evakuasi' },
          { step: 2, title: 'Gunakan Jembatan Penyeberangan', instruction: 'Naiki jembatan penyeberangan pejalan kaki untuk menghindari genangan air di persimpangan utama (500m).', danger: 'Anak tangga licin' },
          { step: 3, title: 'Masuki Gedung Serbaguna Kecamatan', instruction: 'Pintu gerbang timur dibuka untuk pengungsi warga. Dapur umum berada di sayap kanan (300m).', danger: 'Antrean registrasi posko' }
        ];
      }
      return {
        ...p,
        category: 'posko',
        navSteps
      };
    });
  }, []);

  // Combined targets mapping
  const allTargets = useMemo(() => {
    return [...poskoPoints, ...INITIAL_FAMILY_LOCATIONS, ...INITIAL_EMERGENCY_PEOPLE];
  }, [poskoPoints]);

  const selectedPoint = allTargets.find(p => p.id === selectedPointId) || poskoPoints[0];

  const currentNavStep = selectedPoint?.navSteps?.[currentStepIndex] || selectedPoint?.navSteps?.[0];
  const totalNavSteps = selectedPoint?.navSteps?.length || 3;

  // Web Speech API: Text-to-Speech voice guidance
  const speakInstruction = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    setCurrentStepIndex(0);
    const firstStepText = `Navigasi rute ke ${selectedPoint.name}. Langkah 1: ${selectedPoint.navSteps?.[0]?.instruction || ''}`;
    speakInstruction(firstStepText);
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalNavSteps - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = selectedPoint.navSteps?.[nextIdx];
      if (nextStep) {
        speakInstruction(`Langkah ${nextStep.step}: ${nextStep.instruction}`);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = selectedPoint.navSteps?.[prevIdx];
      if (prevStep) {
        speakInstruction(`Langkah ${prevStep.step}: ${prevStep.instruction}`);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
            Screen 08: Safe Route & Panduan Navigasi Bencana
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Rute Evakuasi & Navigasi Panduan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Panduan rute jalan aman dan turn-by-turn navigation dari koordinat GPS Anda menuju posko, keluarga, atau warga yang butuh bantuan.
          </p>
        </div>
      </div>

      {/* Direct GPS Leaflet Map Callout Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D47A1] text-white grid place-items-center shrink-0 shadow-sm">
            <Compass className="w-4 h-4 animate-spin text-[#90CAF9]" />
          </div>
          <div>
            <p className="font-bold text-[#0D47A1] text-sm">Peta GPS Asli (Leaflet + OpenStreetMap)</p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Posisi GPS Anda: <code className="font-mono bg-white px-1 rounded">{gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'GPS Aktif'}</code> ({accuracyText}).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateScreen('safety_map')}
          className="primary-action text-xs shrink-0 py-2 px-3.5 cursor-pointer"
        >
          <span>Buka Peta Global</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DYNAMIC VISUAL ROUTE MAP CANVAS */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#2196F3] bg-slate-900 shadow-xl text-white">
        {/* Map Header Status Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 text-xs font-medium">
            <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded ${
              selectedPoint.category === 'darurat'
                ? 'bg-rose-600'
                : selectedPoint.category === 'keluarga'
                  ? 'bg-blue-600'
                  : 'bg-[#0D47A1]'
            }`}>
              {selectedPoint.category === 'darurat' ? 'RUTE PENYELAMATAN' : selectedPoint.category === 'keluarga' ? 'RUTE KELUARGA' : 'RUTE EVAKUASI'}
            </span>
            <span className="text-slate-300 font-semibold">{selectedPoint.distance} (~{selectedPoint.estTime})</span>
          </div>

          <div className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            <span>GPS Aktif: {accuracyText}</span>
          </div>
        </div>

        {/* Dynamic Visual Route Grid Schematic */}
        <div className="h-64 sm:h-72 w-full bg-gradient-to-b from-slate-950 via-slate-900 to-[#0A192F] relative p-6 flex flex-col justify-between overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          {/* Hazard Zone Water / Flood hazard warning */}
          <div className="absolute -bottom-10 -left-10 w-52 h-44 rounded-full bg-blue-500/20 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-6 left-8 px-3 py-1 bg-rose-950/85 border border-rose-500/50 rounded-lg text-[10px] text-rose-300 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Zona Genangan Air 40cm (Dihindari)</span>
          </div>

          {/* User Starting Point Pin (Bottom Left) */}
          <div className="absolute bottom-16 left-1/4 -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/40 animate-ping"></div>
            <div className="absolute -top-1 w-4 h-4 rounded-full bg-[#0D47A1] border-2 border-white shadow-md"></div>
            <span className="mt-4 px-2 py-0.5 bg-slate-900/90 text-white text-[10px] font-bold rounded shadow-md border border-slate-700 whitespace-nowrap">
              Posisi Anda (GPS)
            </span>
          </div>

          {/* Dynamic SVG Animated Route Path */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d="M 140 180 Q 240 140 360 80"
              fill="transparent"
              stroke={selectedPoint.category === 'darurat' ? '#E11D48' : selectedPoint.category === 'keluarga' ? '#2196F3' : '#10B981'}
              strokeWidth="4"
              strokeDasharray="6,6"
              className="animate-pulse"
            />
          </svg>

          {/* Active Target Destination Pin (Top Right) */}
          <div className="absolute top-12 right-1/4 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shadow-xl ring-4 ${
              selectedPoint.category === 'darurat'
                ? 'bg-rose-600 text-white shadow-rose-600/50 ring-rose-500/30 animate-pulse'
                : selectedPoint.category === 'keluarga'
                  ? 'bg-blue-600 text-white shadow-blue-600/50 ring-blue-500/30'
                  : 'bg-emerald-500 text-white shadow-emerald-500/50 ring-emerald-500/30'
            }`}>
              {selectedPoint.category === 'darurat' ? (
                <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
              ) : selectedPoint.category === 'keluarga' ? (
                <Users className="w-5 h-5 text-white" />
              ) : (
                <MapPin className="w-5 h-5 text-white" />
              )}
            </div>
            <span className={`mt-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg shadow whitespace-nowrap border ${
              selectedPoint.category === 'darurat'
                ? 'bg-rose-950/95 text-rose-300 border-rose-500/60'
                : selectedPoint.category === 'keluarga'
                  ? 'bg-blue-950/95 text-blue-300 border-blue-500/60'
                  : 'bg-emerald-950/95 text-emerald-300 border-emerald-500/60'
            }`}>
              {selectedPoint.name.split(' (')[0]} ({selectedPoint.distance})
            </span>
          </div>
        </div>

        {/* Map Bottom Hint & Action Bar */}
        <div className="p-3.5 bg-slate-950/95 border-t border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-[#90CAF9]" />
            <span>Target: <strong>{selectedPoint.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNavigation}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-white" />
              <span>{isNavigating ? 'Reset Navigasi' : 'Mulai Navigasi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TURN-BY-TURN STEP-BY-STEP LIVE NAVIGATION CARD */}
      <div className={`p-5 rounded-3xl border shadow-lg transition-all ${
        isNavigating
          ? 'bg-gradient-to-b from-blue-900 to-[#0A192F] text-white border-blue-500/60 shadow-blue-500/20'
          : 'glass-card text-slate-800'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                isNavigating ? 'bg-blue-500 text-white' : 'bg-blue-100 text-[#0D47A1]'
              }`}>
                {isNavigating ? 'NAVIGASI AKTIF' : 'PANDUAN JALUR AMAN'}
              </span>
              <span className={`text-xs ${isNavigating ? 'text-blue-200' : 'text-slate-500'}`}>
                Langkah {currentStepIndex + 1} dari {totalNavSteps}
              </span>
            </div>

            <h3 className="font-extrabold text-base sm:text-lg mt-1">
              {currentNavStep?.title || 'Panduan Navigasi'}
            </h3>
          </div>

          {/* Voice Guidance Speaker Button */}
          <button
            type="button"
            onClick={() => speakInstruction(currentNavStep?.instruction || '')}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : isNavigating
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
            }`}
            title="Dengarkan instruksi suara"
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Step Instruction Text */}
        <div className={`mt-3 p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium ${
          isNavigating ? 'bg-white/10 border border-white/15' : 'bg-slate-50 border border-slate-200 text-slate-700'
        }`}>
          {currentNavStep?.instruction}
        </div>

        {/* Hazard Avoidance Alert for this step */}
        {currentNavStep?.danger && (
          <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Waspada: {currentNavStep.danger}</span>
          </div>
        )}

        {/* Navigation Step Switcher Buttons */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-white/20 bg-white/10 text-white cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex gap-1">
            {selectedPoint.navSteps?.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-blue-400'
                    : 'w-2 bg-slate-500/40'
                }`}
              />
            ))}
          </div>

          {currentStepIndex < totalNavSteps - 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <span>Langkah Berikutnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                speakInstruction(`Selamat! Anda telah tiba di ${selectedPoint.name}. Laporkan keberadaan Anda kepada petugas atau konfirmasi kondisi aman.`);
                onNavigateScreen('confirm_safe');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow cursor-pointer animate-pulse"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tiba di Tujuan (Konfirmasi)</span>
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY TABS: Posko, Keluarga, Orang Butuh Bantuan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">
            Pilih Tujuan Rute Evakuasi & Penyelamatan:
          </h3>
          <span className="text-xs text-slate-500">Klik untuk melihat rute</span>
        </div>

        {/* 3 Categories Selector */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('posko');
              setSelectedPointId(poskoPoints[0].id);
              setIsNavigating(false);
              setCurrentStepIndex(0);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'posko'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Posko Evakuasi</span>
            <span className="sm:hidden">Posko</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-[10px] text-slate-700">{poskoPoints.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('keluarga');
              setSelectedPointId(INITIAL_FAMILY_LOCATIONS[0].id);
              setIsNavigating(false);
              setCurrentStepIndex(0);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'keluarga'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Lokasi Keluarga</span>
            <span className="sm:hidden">Keluarga</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-[10px] text-slate-700">{INITIAL_FAMILY_LOCATIONS.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('darurat');
              setSelectedPointId(INITIAL_EMERGENCY_PEOPLE[0].id);
              setIsNavigating(false);
              setCurrentStepIndex(0);
            }}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'darurat'
                ? 'bg-white text-rose-900 shadow-sm'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Butuh Bantuan</span>
            <span className="sm:hidden">Darurat</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-[10px] text-rose-800">{INITIAL_EMERGENCY_PEOPLE.length}</span>
          </button>
        </div>

        {/* LIST OF TARGET CARDS ACCORDING TO ACTIVE TAB */}
        <div className="space-y-3">
          {activeTab === 'posko' && poskoPoints.map((point) => {
            const isSelected = point.id === selectedPointId;
            const isVerified = point.status === 'TERVERIFIKASI';

            return (
              <div
                key={point.id}
                onClick={() => {
                  setSelectedPointId(point.id);
                  setIsNavigating(false);
                  setCurrentStepIndex(0);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#2196F3] ring-2 ring-[#90CAF9]/50 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{point.name}</h4>
                      {isVerified ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>TERVERIFIKASI AMAN</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>STATUS RUTE BELUM TERVERIFIKASI</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                      <span className="font-semibold text-[#0D47A1]">Jarak: {point.distance}</span>
                      <span>•</span>
                      <span className="text-slate-500">{point.estTime}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">{point.elevation}</span>
                    </p>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-[#0D47A1] text-white border-[#0D47A1]' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs animate-fadeIn">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <p className="font-semibold text-slate-700">Catatan Kondisi Lapangan & Aksesibilitas:</p>
                      <p className="text-slate-600 leading-relaxed">{point.notes}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Sumber: {point.verifiedAt}</span>
                      <span>Kapasitas: {point.capacity}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {activeTab === 'keluarga' && INITIAL_FAMILY_LOCATIONS.map((point) => {
            const isSelected = point.id === selectedPointId;

            return (
              <div
                key={point.id}
                onClick={() => {
                  setSelectedPointId(point.id);
                  setIsNavigating(false);
                  setCurrentStepIndex(0);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-500 ring-2 ring-blue-200 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{point.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                        {point.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                      <span className="font-semibold text-[#0D47A1]">Jarak: {point.distance}</span>
                      <span>•</span>
                      <span className="text-slate-500">{point.estTime}</span>
                      <span>•</span>
                      <span className="text-slate-700">{point.vulnerable}</span>
                    </p>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs animate-fadeIn">
                    <div className="p-3 bg-blue-50 rounded-xl space-y-1 text-blue-950">
                      <p className="font-bold">Kondisi & Kebutuhan Khusus:</p>
                      <p className="text-xs leading-relaxed">{point.notes}</p>
                      <p className="font-semibold mt-1">Perlengkapan: {point.needs}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {activeTab === 'darurat' && INITIAL_EMERGENCY_PEOPLE.map((point) => {
            const isSelected = point.id === selectedPointId;

            return (
              <div
                key={point.id}
                onClick={() => {
                  setSelectedPointId(point.id);
                  setIsNavigating(false);
                  setCurrentStepIndex(0);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-50/50 border-rose-500 ring-2 ring-rose-200 shadow-md'
                    : 'bg-white border-slate-200 hover:border-rose-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{point.name}</h4>
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold rounded-md animate-pulse">
                        {point.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                      <span className="font-semibold text-rose-700">Jarak: {point.distance}</span>
                      <span>•</span>
                      <span className="text-slate-500">{point.estTime}</span>
                      <span>•</span>
                      <span className="text-rose-900 font-semibold">{point.vulnerable}</span>
                    </p>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs animate-fadeIn">
                    <div className="p-3 bg-rose-100/70 border border-rose-200 rounded-xl space-y-1 text-rose-950">
                      <p className="font-bold">Kebutuhan Evakuasi Darurat:</p>
                      <p className="text-xs leading-relaxed">{point.notes}</p>
                      <p className="font-bold text-rose-800 mt-1">Kebutuhan: {point.needs}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={`tel:${point.contact}`}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Hubungi ({point.contact})</span>
                      </a>
                      <span className="text-[11px] text-slate-500">Laporan GPS Aktif</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fallback Statement */}
      <div className="p-4 bg-[#E3F2FD] rounded-2xl border border-[#90CAF9] text-xs text-[#0D47A1] space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-[#2196F3]" />
          <span>Prinsip Keselamatan Navigasi (PRD 4.6):</span>
        </div>
        <p className="leading-relaxed text-slate-700">
          Jika kondisi lapangan terhalang banjir mendadak, pohon tumbang, atau jaringan internet terputus, <strong>ikuti instruksi petugas patroli dan relawan setempat</strong>. Sistem tidak mengarang rute darurat secara fiktif.
        </p>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="secondary-action text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateScreen('checklist')}
          className="primary-action text-xs"
        >
          <span>Lanjut ke Tas Siaga Checklist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
