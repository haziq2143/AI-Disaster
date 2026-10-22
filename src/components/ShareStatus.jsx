import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  EyeOff,
  MapPin,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react';

const statusOptions = [
  { id: 'help', label: 'Butuh bantuan', hint: 'Saya membutuhkan bantuan' },
  { id: 'checking', label: 'Sedang memeriksa kondisi', hint: 'Saya belum bisa memastikan keadaan' },
  { id: 'safe', label: 'Sudah mengonfirmasi aman', hint: 'Saya mengonfirmasi kondisi saya sendiri' },
  { id: 'unknown', label: 'Belum ada konfirmasi', hint: 'Bagikan area tanpa status khusus' }
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
    setFeedback('Status demo berhasil dibagikan. Anda dapat menghentikannya kapan saja.');
  };

  const handleStopSharing = () => {
    setIsShareActive(false);
    setConsent(false);
    setFeedback('Berbagi status demo dihentikan.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <header className="flex items-start gap-3">
        <button type="button" onClick={onBack} className="icon-action mt-1" aria-label="Kembali ke peta"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <span className="eyebrow">Layar 12 · Persetujuan dan moderasi komunitas</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">Bagikan status dengan aman</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">Pilih sendiri informasi yang ingin dibagikan. Peta komunitas menggunakan area perkiraan, bukan koordinat rumah.</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5 items-start">
        <section className="glass-card p-5 sm:p-6 space-y-6">
          <div>
            <h2 className="font-extrabold text-slate-900">Status yang ingin dibagikan</h2>
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {statusOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateChoice(setStatus, option.id)}
                  aria-pressed={status === option.id}
                  className={`text-left rounded-2xl border p-3 transition-all ${status === option.id ? 'border-blue-400 bg-blue-50/80 ring-2 ring-blue-100' : 'border-white/80 bg-white/50 hover:bg-white/80'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{option.label}</span>
                    {status === option.id && <Check className="w-4 h-4 text-blue-700" />}
                  </span>
                  <span className="block text-xs text-slate-600 mt-1">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Area perkiraan
            <span className="block font-normal text-slate-500 mt-1">Hanya nama area yang dibagikan, bukan titik rumah atau koordinat presisi.</span>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700" />
              <input value={area} onChange={event => updateChoice(setArea, event.target.value)} className="form-control pl-10" placeholder="Contoh: Kelurahan Sukajadi" />
            </div>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-700">
              Siapa yang dapat melihat
              <select value={visibility} onChange={event => updateChoice(setVisibility, event.target.value)} className="form-control mt-2">
                <option value="public">Komunitas di peta demo</option>
                <option value="contacts">Kontak tepercaya (simulasi)</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Masa berlaku status
              <select value={expiry} onChange={event => updateChoice(setExpiry, event.target.value)} className="form-control mt-2">
                <option>1 jam</option>
                <option>6 jam</option>
                <option>12 jam</option>
                <option>24 jam</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-800 shrink-0" />
            <div className="text-xs leading-relaxed text-blue-950">
              <strong>Lokasi belum diverifikasi secara menyeluruh.</strong> Prototype web tidak dapat memastikan apakah aplikasi lokasi palsu digunakan. Tidak ada pemeriksaan perangkat sungguhan pada demo ini.
              <button type="button" onClick={() => setFeedback('Permintaan peninjauan demo dicatat. Tidak ada pemeriksaan perangkat atau pengiriman lokasi yang dilakukan.')} className="block underline font-bold mt-2">Minta tinjau lokasi (simulasi)</button>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/55 p-3 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setFeedback(''); }} className="mt-0.5 accent-blue-700 w-4 h-4" />
            <span className="text-xs leading-relaxed text-slate-700">
              Saya memahami bahwa <strong>{selectedStatus.label.toLowerCase()}</strong> dan area <strong>{area || 'belum ditentukan'}</strong> akan ditampilkan sebagai laporan pengguna kepada {visibility === 'public' ? 'komunitas pada peta' : 'kontak tepercaya (simulasi)'}, berlaku selama {expiry}. Status ini bukan verifikasi resmi.
            </span>
          </label>

          {feedback && <p role="status" className={`text-sm font-semibold ${feedback.includes('Setujui') ? 'text-rose-700' : 'text-emerald-800'}`}>{feedback}</p>}

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-1">
            <button type="button" onClick={onBack} className="secondary-action"><ArrowLeft className="w-4 h-4" />Kembali ke peta</button>
            <div className="flex flex-col sm:flex-row gap-2">
              {isShareActive && <button type="button" onClick={handleStopSharing} className="danger-action"><EyeOff className="w-4 h-4" />Hentikan berbagi</button>}
              <button type="button" onClick={handlePublish} className="primary-action"><Eye className="w-4 h-4" />{isShareActive ? 'Perbarui status demo' : 'Bagikan status demo'}</button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Pratinjau visual peta</p>
                <h2 className="font-extrabold text-slate-900 mt-2">{selectedStatus.label}</h2>
              </div>
              <div className={`w-12 h-12 rounded-2xl grid place-items-center ${
                status === 'help' 
                  ? 'bg-rose-100 text-rose-700 animate-pulse' 
                  : status === 'safe' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {status === 'help' ? <TriangleAlert className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
              </div>
            </div>

            {/* Visual representation badge: PIN vs Radius 1km */}
            <div className={`rounded-2xl border p-4 transition-all ${
              status === 'help'
                ? 'bg-rose-50/90 border-rose-200'
                : 'bg-blue-50/80 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                {status === 'help' ? (
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] uppercase tracking-wider font-extrabold">
                    🔴 PIN Presisi Darurat (SOS)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] uppercase tracking-wider font-extrabold">
                    🔵 Lingkaran Radius 1 km
                  </span>
                )}
              </div>

              <p className="font-bold text-sm text-slate-900 mt-2">
                {status === 'help' ? 'Titik Evakuasi Terbuka' : 'Area Perkiraan (~1 km)'} • {area || 'Sukajadi'}
              </p>
              
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {status === 'help'
                  ? 'Karena Anda butuh bantuan, lokasi presisi disiarkan sebagai PIN agar penolong dapat menemukan Anda secepatnya.'
                  : 'Orang lain hanya melihat lingkaran radius perkiraan 1 km. Koordinat presisi rumah Anda dirahasiakan.'}
              </p>

              <p className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200/60">
                <Clock3 className="w-3.5 h-3.5" />
                Kedaluwarsa dalam {expiry} · Laporan belum diverifikasi
              </p>
            </div>

            <span className="demo-badge">DATA DEMO · SIMULASI LOMBA</span>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="flex items-start gap-2">
              <TriangleAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-extrabold text-amber-950">Prinsip Privasi Kebencanaan</h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Jangan pernah cantumkan nama lengkap anak, nomor telepon, atau data sensitif di deskripsi publik. Anda dapat mematikan sinyal atau mengembalikan ke radius 1 km kapan saja setelah kondisi aman.
                </p>
              </div>
            </div>
          </section>

          <section className="glass-card p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Laporkan pin atau spam</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Pilih pin pada peta untuk melaporkan lokasi yang tampak keliru, spam, atau informasi menyesatkan. Identitas pelapor tidak ditampilkan.</p>
            <button type="button" onClick={onBack} className="secondary-action w-full mt-3"><EyeOff className="w-4 h-4" />Pilih pin untuk melaporkan</button>
            <p className="text-[11px] text-slate-500 mt-2">Proses moderasi pada prototype ini hanya simulasi.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
