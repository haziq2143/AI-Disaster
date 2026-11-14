import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  EyeOff,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Radio,
  Share2
} from 'lucide-react';

const statusOptions = [
  { id: 'help', label: 'Butuh bantuan', hint: 'Saya membutuhkan bantuan darurat', iconColor: 'text-rose-600', ringColor: 'border-rose-400 bg-rose-50/80' },
  { id: 'checking', label: 'Sedang memeriksa kondisi', hint: 'Saya belum bisa memastikan keadaan', iconColor: 'text-amber-600', ringColor: 'border-amber-400 bg-amber-50/80' },
  { id: 'safe', label: 'Sudah mengonfirmasi aman', hint: 'Saya mengonfirmasi kondisi saya sendiri', iconColor: 'text-emerald-600', ringColor: 'border-emerald-400 bg-emerald-50/80' },
  { id: 'unknown', label: 'Belum ada konfirmasi', hint: 'Bagikan area tanpa status khusus', iconColor: 'text-blue-600', ringColor: 'border-blue-400 bg-blue-50/80' }
];

export default function ShareStatus({
  isShareActive,
  setIsShareActive,
  safetyShareDetails,
  setSafetyShareDetails,
  onBack
}) {
  const [status, setStatus] = useState(safetyShareDetails.status);
  const [area, setArea] = useState(safetyShareDetails.area);
  const [visibility, setVisibility] = useState(safetyShareDetails.visibility);
  const [expiry, setExpiry] = useState(safetyShareDetails.expiresIn);
  const [consent, setConsent] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedStatus = statusOptions.find(option => option.id === status) || statusOptions[1];
  const updateChoice = (setter, value) => {
    setter(value);
    setConsent(false);
    setFeedback('');
  };

  const handlePublish = () => {
    if (!consent) {
      setFeedback('Setujui pembagian informasi sebelum menerbitkan status.');
      return;
    }
    setSafetyShareDetails({ status, area: area.trim() || 'Area belum ditentukan', visibility, expiresIn: expiry });
    setIsShareActive(true);
    setFeedback('Status berhasil dibagikan ke peta. Anda dapat menghentikannya kapan saja.');
  };

  const handleStopSharing = () => {
    setIsShareActive(false);
    setConsent(false);
    setFeedback('Berbagi status dihentikan.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Modern Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex items-start gap-4">
        <button 
          type="button" 
          onClick={onBack} 
          className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition-colors cursor-pointer mt-0.5" 
          aria-label="Kembali ke peta"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
              <Share2 className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
              Privasi & Peta Komunitas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bagikan Status dengan Aman
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
            Pilih sendiri informasi yang ingin dibagikan. Peta komunitas warga menggunakan radius perkiraan (~1 km) untuk melindungi koordinat rumah Anda.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5 items-start">
        {/* Main Settings Form Card */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Status yang Ingin Dibagikan</h2>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
              {statusOptions.map(option => {
                const isSelected = status === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateChoice(setStatus, option.id)}
                    aria-pressed={isSelected}
                    className={`text-left rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-200 shadow-xs' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                    </div>
                    <span className="block text-[11px] text-slate-500 font-medium mt-1">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800">
              Nama Area Perkiraan (Bukan Alamat Presisi):
            </label>
            <span className="block text-[11px] font-medium text-slate-500">
              Hanya nama kelurahan/desa yang dibagikan, bukan titik rumah atau koordinat presisi.
            </span>
            <div className="relative mt-2">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 shrink-0 pointer-events-none" />
              <input 
                value={area} 
                onChange={event => updateChoice(setArea, event.target.value)} 
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-300 bg-slate-50/60 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-xs" 
                placeholder="Contoh: Kelurahan Sukajadi, Baleendah..." 
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                Siapa yang Dapat Melihat:
              </label>
              <select 
                value={visibility} 
                onChange={event => updateChoice(setVisibility, event.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
              >
                <option value="public">Komunitas di Peta Warga</option>
                <option value="contacts">Hanya Kontak Tepercaya</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                Masa Berlaku Status:
              </label>
              <select 
                value={expiry} 
                onChange={event => updateChoice(setExpiry, event.target.value)} 
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
              >
                <option value="1 jam">1 Jam</option>
                <option value="6 jam">6 Jam</option>
                <option value="12 jam">12 Jam</option>
                <option value="24 jam">24 Jam</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-blue-950 font-medium">
              <strong>Privasi Koordinat Terlindungi:</strong> Koordinat tempat tinggal Anda disamarkan dalam radius perkiraan 1 km secara otomatis saat status bukan &apos;Butuh Bantuan&apos;.
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 p-3.5 cursor-pointer transition-all">
            <input 
              type="checkbox" 
              checked={consent} 
              onChange={event => { setConsent(event.target.checked); setFeedback(''); }} 
              className="mt-0.5 accent-blue-600 w-4 h-4 shrink-0 rounded" 
            />
            <span className="text-xs leading-relaxed text-slate-700 font-medium">
              Saya memahami bahwa status <strong>{selectedStatus.label.toLowerCase()}</strong> dan area <strong>{area || 'belum ditentukan'}</strong> akan dibagikan kepada {visibility === 'public' ? 'komunitas pada peta warga' : 'kontak tepercaya'}, berlaku selama {expiry}.
            </span>
          </label>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedback.includes('Setujui') ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              <Check className="w-4 h-4 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Action Buttons with explicit gap and inline-flex to prevent touching text */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-2 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onBack} 
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Kembali ke Peta</span>
            </button>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {isShareActive && (
                <button 
                  type="button" 
                  onClick={handleStopSharing} 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  <EyeOff className="w-4 h-4 shrink-0" />
                  <span>Hentikan Berbagi</span>
                </button>
              )}
              
              <button 
                type="button" 
                onClick={handlePublish} 
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>{isShareActive ? 'Perbarui Status' : 'Bagikan Status'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Aside Visual Preview Card */}
        <aside className="space-y-4">
          <section className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Pratinjau Visual Peta
                </span>
                <h3 className="font-black text-slate-900 text-base mt-0.5">
                  {selectedStatus.label}
                </h3>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                status === 'help' 
                  ? 'bg-rose-100 text-rose-700 animate-pulse' 
                  : status === 'safe' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {status === 'help' ? <TriangleAlert className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              </div>
            </div>

            {/* Visual representation badge: PIN vs Radius 1km */}
            <div className={`rounded-2xl border p-4 transition-all space-y-2 ${
              status === 'help'
                ? 'bg-rose-50/90 border-rose-200'
                : 'bg-blue-50/80 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {status === 'help' ? (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] uppercase tracking-wider font-extrabold inline-flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>PIN Presisi Darurat (SOS)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] uppercase tracking-wider font-extrabold inline-flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>Lingkaran Radius 1 km</span>
                  </span>
                )}
              </div>

              <p className="font-extrabold text-sm text-slate-900 pt-1">
                {status === 'help' ? 'Titik Evakuasi Terbuka' : 'Area Perkiraan (~1 km)'} • {area || 'Sukajadi'}
              </p>
              
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {status === 'help'
                  ? 'Karena Anda butuh bantuan, lokasi presisi disiarkan sebagai PIN agar tim penolong dapat menemukan Anda secepatnya.'
                  : 'Orang lain hanya melihat lingkaran radius perkiraan 1 km. Koordinat presisi rumah Anda dirahasiakan demi keamanan.'}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-200/60">
                <Clock3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Kedaluwarsa dalam {expiry} • Laporan Komunitas</span>
              </div>
            </div>
          </section>

          {/* Privacy Reminder Card */}
          <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <TriangleAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Prinsip Privasi Kebencanaan
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Jangan pernah mencantumkan nama lengkap anak, nomor telepon pribadi, atau informasi sensitif di nama area. Anda dapat mematikan sinyal berbagi kapan saja setelah situasi aman.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
