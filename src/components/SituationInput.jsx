'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Keyboard, 
  MapPin, 
  Users, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  ShieldAlert,
  Volume2,
  Waves,
  Activity,
  Flame,
  Mountain,
  Crosshair,
  Check,
  Baby,
  Accessibility,
  HeartPulse,
  Info,
  Compass
} from 'lucide-react';
import { HAZARD_TYPES } from '../data/mockData';

export default function SituationInput({ 
  hazardData, 
  setHazardData, 
  onNext, 
  onBack 
}) {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isGpsDetecting, setIsGpsDetecting] = useState(false);
  const [selectedVulnerableTags, setSelectedVulnerableTags] = useState([]);

  // Sample realistic voice recordings simulation
  const mockRecordings = [
    "Air di depan rumah mulai setinggi lutut orang dewasa, arus makin deras dari arah sungai. Di rumah ada nenek yang butuh kursi roda dan anak kecil 5 tahun. Listrik baru saja padam.",
    "Tadi ada guncangan gempa kuat sekitar 30 detik. Tembok samping retak dan genteng berjatuhan. Kami ada di teras terbuka bersama 3 orang, butuh tahu titik kumpul terdekat.",
    "Asap tebal masuk dari gang sebelah karena kebakaran ruko. Jarak pandang mulai berkurang dan bau sangit menusuk hidung. Kami berempat siap keluar rumah."
  ];

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        const textSample = hazardData.type === 'gempa' 
          ? mockRecordings[1] 
          : hazardData.type === 'kebakaran' 
            ? mockRecordings[2] 
            : mockRecordings[0];
        setVoiceTranscript(textSample);
        setHazardData(prev => ({ ...prev, description: textSample }));
        setIsRecording(false);
      }, 2200);
    } else {
      setIsRecording(false);
    }
  };

  const handleUsePreset = (text, categoryTag) => {
    setHazardData(prev => ({ 
      ...prev, 
      description: text,
      hasVulnerable: categoryTag ? 'yes' : prev.hasVulnerable
    }));
  };

  const toggleVulnerableTag = (tagLabel) => {
    let updated;
    if (selectedVulnerableTags.includes(tagLabel)) {
      updated = selectedVulnerableTags.filter(t => t !== tagLabel);
    } else {
      updated = [...selectedVulnerableTags, tagLabel];
    }
    setSelectedVulnerableTags(updated);
    setHazardData(prev => ({
      ...prev,
      hasVulnerable: updated.length > 0 ? 'yes' : 'no',
      vulnerable_members: updated.join(', ')
    }));
  };

  const handleDetectGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsDetecting(false);
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setHazardData(prev => ({
          ...prev,
          location: `GPS: ${lat}, ${lng} (Terkunci Otomatis)`
        }));
      },
      () => {
        setIsGpsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const canProceed = Boolean(hazardData.description && hazardData.description.trim().length >= 10);

  // Helper mapping icon for hazard types
  const getHazardIcon = (id) => {
    switch (id) {
      case 'banjir': return <Waves className="w-5 h-5 text-sky-600" />;
      case 'gempa': return <Activity className="w-5 h-5 text-rose-600" />;
      case 'kebakaran': return <Flame className="w-5 h-5 text-orange-600" />;
      case 'longsor': return <Mountain className="w-5 h-5 text-amber-700" />;
      case 'erupsi': return <AlertCircle className="w-5 h-5 text-purple-600" />;
      default: return <HelpCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* 1. VISUAL STEPPER BREADCRUMB */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs font-extrabold pb-1">
          <div className="flex items-center gap-2 text-blue-700 shrink-0">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] shadow-xs">
              1
            </span>
            <span className="border-b-2 border-blue-600 pb-0.5">Input Kondisi</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
              2
            </span>
            <span>Tinjau Data</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
              3
            </span>
            <span>Analisis AI</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
              4
            </span>
            <span>Panduan Siaga</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER TITLE CARD */}
      <div className="text-left space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Sistem Siaga Tanggap Bencana Terstruktur</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Ceritakan Kondisi Darurat di Sekitar Anda
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
          Evacu8 akan menyusun rencana evakuasi mandiri 1-langkah, mendeteksi jalur teraman, serta menghubungkan informasi Anda dengan posko terdekat.
        </p>
      </div>

      {/* 3. HAZARD TYPE SELECTION BENTO CARDS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>Pilih Jenis Ancaman Bencana</span>
          </label>
          <span className="text-[11px] text-slate-400 font-semibold">Dapat disesuaikan sewaktu-waktu</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {HAZARD_TYPES.map(h => {
            const isSelected = hazardData.type === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setHazardData(prev => ({ ...prev, type: h.id }))}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                  isSelected 
                    ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-2 ring-blue-500/20' 
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isSelected ? 'bg-white shadow-xs' : 'bg-white/80'
                  }`}>
                    {getHazardIcon(h.id)}
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="mt-2.5">
                  <p className={`text-xs font-black leading-snug ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                    {h.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {h.desc || 'Informasi bencana'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN SITUATION INPUT (TEXT VS VOICE) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
        
        {/* Input Mode Switcher Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Uraian Kondisi & Kebutuhan
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Jelaskan ketinggian air, kerusakan struktur, atau kondisi fisik sekitar Anda.
            </p>
          </div>

          {/* Segmented Control Pill */}
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                inputMode === 'text' 
                  ? 'bg-white text-blue-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Ketik Teks</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                inputMode === 'voice' 
                  ? 'bg-white text-blue-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Contoh Suara</span>
            </button>
          </div>
        </div>

        {/* VOICE MODE ACTIVE */}
        {inputMode === 'voice' && (
          <div className="p-6 bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-white rounded-2xl border border-blue-200 text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              {isRecording && (
                <span className="absolute w-24 h-24 rounded-full bg-rose-400/30 animate-ping" />
              )}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isRecording 
                    ? 'bg-rose-600 text-white shadow-rose-500/40 ring-8 ring-rose-100 animate-pulse' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
                }`}
                title="Klik untuk memicu simulasi rekaman suara"
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>

            <div>
              <p className="font-extrabold text-slate-900 text-sm">
                {isRecording ? 'Mendengarkan & mentranskripsikan suara darurat...' : 'Simulasi Pengenalan Suara'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Klik mikrofon untuk mengisi transkrip otomatis sesuai jenis bencana yang dipilih. Privasi aman; mikrofon fisik tidak direkam permanen ke server.
              </p>
            </div>

            {voiceTranscript && (
              <div className="p-3 bg-white rounded-xl border border-blue-200 text-left text-xs text-slate-800 shadow-2xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Hasil Transkrip:
                </span>
                <p className="italic font-medium leading-relaxed">"{voiceTranscript}"</p>
              </div>
            )}
          </div>
        )}

        {/* TEXT AREA INPUT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Tuliskan Situasi Lapangan:</span>
            <span className={`text-[11px] font-bold ${canProceed ? 'text-emerald-600' : 'text-slate-400'}`}>
              {hazardData.description ? `${hazardData.description.trim().length} karakter` : 'Minimal 10 karakter'}
              {canProceed && ' ✓'}
            </span>
          </div>

          <textarea
            value={hazardData.description || ''}
            onChange={(e) => setHazardData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Contoh: Air banjir di depan pagar sudah 40 cm dan mengalir deras. Di rumah ada 3 orang, termasuk nenek yang butuh kursi roda dan anak balita. Listrik sudah dipadamkan..."
            rows={4}
            className="w-full p-4 rounded-2xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-xs sm:text-sm leading-relaxed transition-all resize-y text-slate-800 placeholder:text-slate-400 bg-slate-50/40 focus:bg-white shadow-2xs"
          />

          {/* Quick Scenario Preset Chips */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Skenario cepat (1-klik isi situasi):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleUsePreset("Banjir setinggi betis dan naik cepat. Saya bersama nenek lansia yang menggunakan kursi roda dan anak balita 4 tahun.", true)}
                className="text-[11px] font-bold px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl transition-colors border border-sky-200 cursor-pointer flex items-center gap-1.5"
              >
                <Waves className="w-3.5 h-3.5 text-sky-600" />
                <span>Banjir + Lansia & Balita</span>
              </button>

              <button
                type="button"
                onClick={() => handleUsePreset("Gempa bumi kuat mengguncang sekitar 30 detik. Tembok samping rumah retak, genteng berjatuhan, dan listrik padam total.", false)}
                className="text-[11px] font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl transition-colors border border-rose-200 cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-rose-600" />
                <span>Gempa + Tembok Retak</span>
              </button>

              <button
                type="button"
                onClick={() => handleUsePreset("Bau asap tebal dari ruko seberang jalan. Jarak pandang mulai berkurang dan mulai sesak napas. Kami berempat bersiap keluar.", false)}
                className="text-[11px] font-bold px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl transition-colors border border-orange-200 cursor-pointer flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>Kebakaran Asap Pekat</span>
              </button>

              <button
                type="button"
                onClick={() => handleUsePreset("Pergerakan tanah longsor menimbun jalan utama desa. Tiang listrik miring dan jalur evakuasi mobil terputus total.", false)}
                className="text-[11px] font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition-colors border border-amber-200 cursor-pointer flex items-center gap-1.5"
              >
                <Mountain className="w-3.5 h-3.5 text-amber-700" />
                <span>Longsor Jalur Terputus</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. VULNERABLE MEMBERS QUICK SELECTOR */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Apakah Bersama Anggota Keluarga Rentan?</span>
            </label>
            <span className="text-[10px] text-slate-400">Penting untuk prioritas SAR</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'Lansia', label: 'Lansia / Kursi Roda', icon: Accessibility },
              { id: 'Bayi', label: 'Bayi / Balita', icon: Baby },
              { id: 'Ibu Hamil', label: 'Ibu Hamil', icon: HeartPulse },
              { id: 'Cedera', label: 'Korban Luka / Sakit', icon: AlertCircle }
            ].map(tag => {
              const isSelected = selectedVulnerableTags.includes(tag.id);
              const TagIcon = tag.icon;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleVulnerableTag(tag.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs ring-1 ring-rose-400/40'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>{tag.label}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3] ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. LOCATION PINPOINT WITH 1-TAP GPS */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Perkiraan Lokasi / Alamat Saat Ini (Opsional):</span>
            </label>
            <span className="text-[10px] text-slate-400">Privasi lokal terjaga</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={hazardData.location || ''}
                onChange={(e) => setHazardData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Misal: Kelurahan Sukajadi, RT 02 / RW 04"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 text-xs sm:text-sm text-slate-800 outline-none shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={handleDetectGps}
              disabled={isGpsDetecting}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
              title="Gunakan koordinat GPS perangkat fisik sekarang"
            >
              <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${isGpsDetecting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isGpsDetecting ? 'Mencari...' : 'Kunci GPS'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 7. BOTTOM NAVIGATION BAR */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className={`flex items-center gap-2 px-6 sm:px-8 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Tinjau Ringkasan & Koreksi</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
