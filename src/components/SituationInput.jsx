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
  Volume2
} from 'lucide-react';
import { HAZARD_TYPES } from '../data/mockData';

export default function SituationInput({ 
  hazardData, 
  setHazardData, 
  onNext, 
  onBack 
}) {
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [hasSpecialNeeds, setHasSpecialNeeds] = useState(false);
  const [needsDetail, setNeedsDetail] = useState('');

  // Sample realistic voice recordings simulation
  const mockRecordings = [
    "Air di depan rumah mulai setinggi lutut orang dewasa, arus makin deras dari arah sungai. Di rumah ada nenek yang butuh kursi roda dan anak kecil 5 tahun. Listrik baru saja padam.",
    "Tadi ada guncangan gempa kuat sekitar 30 detik. Tembok samping retak dan genteng berjatuhan. Kami ada di teras terbuka bersama 3 orang, butuh tahu titik kumpul terdekat.",
    "Asap tebal masuk dari gang sebelah karena kebakaran ruko. Jarak pandang mulai berkurang dan bau sangit menusuk hidung. Kami berempat siap keluar."
  ];

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate real-time streaming speech recognition
      setTimeout(() => {
        const textSample = hazardData.type === 'gempa' 
          ? mockRecordings[1] 
          : hazardData.type === 'kebakaran' 
            ? mockRecordings[2] 
            : mockRecordings[0];
        setVoiceTranscript(textSample);
        setHazardData(prev => ({ ...prev, description: textSample }));
        setIsRecording(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const handleUsePreset = (text) => {
    setHazardData(prev => ({ ...prev, description: text }));
  };

  const canProceed = (hazardData.description && hazardData.description.trim().length > 5);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Stepper info */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
            Langkah 1 dari 4: Input Situasi
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Ceritakan Kondisi Darurat Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Panduan statis demo tidak menganalisis atau memverifikasi kondisi lapangan.
          </p>
        </div>
      </div>

      {/* Hazard Type Selector Pill Row */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>Jenis Ancaman / Bencana Saat Ini:</span>
          <span className="text-[11px] text-[#2196F3] font-normal">Dapat diganti kapan saja</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {HAZARD_TYPES.map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHazardData(prev => ({ ...prev, type: h.id }))}
              className={`p-2.5 rounded-xl border text-center transition-all text-xs font-medium cursor-pointer ${
                hazardData.type === h.id 
                  ? 'bg-[#0D47A1] text-white border-[#0D47A1] shadow-sm font-semibold' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#90CAF9]'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Mode Toggle (Text vs Voice) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Metode Penyampaian Kondisi:
          </span>
          <div className="flex p-1 bg-[#E3F2FD] rounded-xl border border-[#90CAF9]/50">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'text' 
                  ? 'bg-white text-[#0D47A1] shadow-xs' 
                  : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Ketik Teks</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                inputMode === 'voice' 
                  ? 'bg-white text-[#0D47A1] shadow-xs' 
                  : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-[#2196F3]" />
              <span>Contoh Transkrip</span>
            </button>
          </div>
        </div>

        {/* VOICE MODE INTERFACE */}
        {inputMode === 'voice' && (
          <div className="p-6 bg-gradient-to-b from-[#E3F2FD]/40 to-white rounded-2xl border border-[#90CAF9] text-center space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isRecording 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/40 animate-pulse ring-8 ring-rose-100' 
                    : 'bg-[#2196F3] text-white hover:bg-[#0D47A1] shadow-md hover:shadow-lg'
                }`}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>

            <div>
              <p className="font-bold text-slate-800 text-sm">
                {isRecording ? 'Menyiapkan contoh transkrip...' : 'Tampilkan Contoh Transkrip Suara'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Tombol ini hanya mengisi contoh teks otomatis. Mikrofon tidak diakses dan suara Anda tidak direkam.
              </p>
            </div>

            {/* Permission feedback badge */}
            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#0D47A1] bg-[#E3F2FD] px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2196F3]" />
              <span>Simulasi transkrip · mikrofon tidak diakses</span>
            </div>
          </div>
        )}

        {/* TEXT INPUT AREA */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Uraian Kondisi Anda:</span>
            <span className="text-[11px] text-slate-400">Minimal 10 karakter</span>
          </label>
          <textarea
            value={hazardData.description || ''}
            onChange={(e) => setHazardData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Contoh: Air banjir di depan pagar sudah 40 cm dan mengalir deras. Kami ada 3 orang di rumah, salah satunya lansia yang sulit jalan tanpa tongkat..."
            rows={4}
            className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-[#2196F3] focus:ring-3 focus:ring-[#90CAF9]/40 outline-none text-sm leading-relaxed transition-all resize-y text-slate-800 placeholder:text-slate-400"
          />

          {/* Quick Preset Buttons for testing under pressure */}
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Atau gunakan simulasi skenario cepat:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleUsePreset("Banjir setinggi betis dan naik cepat. Saya bersama lansia yang membutuhkan obat rutin dan anak balita.")}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-[#E3F2FD] text-slate-700 hover:text-[#0D47A1] rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                🌊 Banjir + Lansia & Balita
              </button>
              <button
                type="button"
                onClick={() => handleUsePreset("Gempa bumi kuat mengguncang. Dinding rumah retak, listrik mati, kami berkumpul di teras depan.")}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-[#E3F2FD] text-slate-700 hover:text-[#0D47A1] rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                ⚡ Gempa + Kerusakan Dinding
              </button>
              <button
                type="button"
                onClick={() => handleUsePreset("Bau asap tebal dari ruko tetangga. Udara panas dan mulai sesak napas. Siap keluar rumah.")}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-[#E3F2FD] text-slate-700 hover:text-[#0D47A1] rounded-lg transition-colors border border-slate-200 cursor-pointer"
              >
                🔥 Kebakaran Asap Pekat
              </button>
            </div>
          </div>
        </div>

        {/* Location Optional (PRD 4.2: Sistem tidak boleh menganggap lokasi tidak ada sebagai fakta) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2196F3]" />
              Perkiraan Lokasi / Kelurahan (Opsional):
            </span>
            <span className="text-[11px] text-slate-400">Tidak melacak tanpa izin</span>
          </label>
          <input
            type="text"
            value={hazardData.location || ''}
            onChange={(e) => setHazardData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Misal: Kelurahan Sukajadi, RT 02 / RW 04"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2196F3] text-sm text-slate-800 outline-none"
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
            canProceed
              ? 'bg-[#0D47A1] text-white hover:bg-[#1565C0] hover:shadow-lg'
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
