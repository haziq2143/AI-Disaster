import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Filter,
  List,
  MapPin,
  MapPinned,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';

const safetyPins = [
  { id: 'p1', alias: 'Warga Sukajadi', area: 'Sukajadi, Bandung', status: 'help', label: 'Butuh bantuan', updated: '4 menit lalu', expiresIn: '56 menit', x: '27%', y: '58%' },
  { id: 'p2', alias: 'Anonim • RW 04', area: 'Sukajadi, Bandung', status: 'safe', label: 'Sudah mengonfirmasi aman', updated: '8 menit lalu', expiresIn: '52 menit', x: '64%', y: '31%' },
  { id: 'p3', alias: 'Warga Cempaka', area: 'Cempaka, Bandung', status: 'checking', label: 'Sedang memeriksa kondisi', updated: '12 menit lalu', expiresIn: '48 menit', x: '77%', y: '66%' },
  { id: 'p4', alias: 'Anonim • Utara', area: 'Bandung Utara', status: 'unknown', label: 'Belum ada konfirmasi', updated: '27 menit lalu', expiresIn: '33 menit', x: '43%', y: '22%' }
];

const statusColors = {
  help: 'bg-rose-500',
  safe: 'bg-emerald-500',
  checking: 'bg-amber-400',
  unknown: 'bg-slate-400'
};

const reportReasons = ['Lokasi terlihat tidak akurat', 'Spam atau laporan berulang', 'Informasi menyesatkan', 'Konten tidak pantas'];

export default function GlobalSafetyMap({ isShareActive, safetyShareDetails, onNavigateScreen }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPinId, setSelectedPinId] = useState('p1');
  const [showList, setShowList] = useState(false);
  const [reportPin, setReportPin] = useState(null);
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [area, setArea] = useState('Semua area');

  const visiblePins = useMemo(
    () => safetyPins.filter(pin => (
      (activeFilter === 'all' || pin.status === activeFilter)
      && (area === 'Semua area' || pin.area.toLowerCase().includes(area.toLowerCase()))
    )),
    [activeFilter, area]
  );
  const selectedPin = visiblePins.find(pin => pin.id === selectedPinId) || visiblePins[0];

  const closeReport = () => {
    setReportPin(null);
    setReportSubmitted(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Layar 11 · Peta keselamatan komunitas</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">Global Safety Map</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Lihat laporan status yang dibagikan secara sukarela. Pin adalah laporan pengguna, bukan konfirmasi kondisi resmi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateScreen('share_status')}
          className="primary-action w-full sm:w-auto"
        >
          <MapPinned className="w-4 h-4" />
          {isShareActive ? 'Kelola status saya' : 'Bagikan status'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      <div className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 grid place-items-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <p className="font-bold text-sm text-slate-900">Privasi dan status laporan</p>
            <p className="text-xs text-slate-600 mt-1">Lokasi perkiraan ditampilkan. Status bukan bukti bahwa seseorang pasti aman atau dalam bahaya.</p>
          </div>
        </div>
        <span className="demo-badge shrink-0">DATA DEMO · BUKAN REAL-TIME</span>
      </div>

      {isShareActive && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-emerald-900 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Status Anda dibagikan di area {safetyShareDetails.area}
          </span>
          <button type="button" className="text-emerald-800 underline font-semibold" onClick={() => onNavigateScreen('share_status')}>
            Ubah atau hentikan
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <section className={`glass-card relative min-h-[340px] overflow-hidden p-4 flex-1 ${showList ? 'hidden lg:block' : ''}`} aria-label="Peta demo laporan status">
          <div className="map-canvas absolute inset-0" aria-hidden="true">
            <div className="map-water map-water-one" />
            <div className="map-water map-water-two" />
            <div className="map-road map-road-one" />
            <div className="map-road map-road-two" />
            <div className="map-road map-road-three" />
            <span className="map-place map-place-one">SUKAJADI</span>
            <span className="map-place map-place-two">CEMPAKA</span>
            <span className="map-place map-place-three">BANDUNG UTARA</span>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="rounded-xl border border-white/70 bg-white/80 backdrop-blur-md px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-blue-700" />
              Area perkiraan · Bandung
            </span>
            <button type="button" onClick={() => setShowList(true)} className="lg:hidden icon-action" aria-label="Lihat daftar pin">
              <List className="w-4 h-4" />
            </button>
          </div>

          {visiblePins.map(pin => (
            <button
              key={pin.id}
              type="button"
              aria-label={`${pin.label}, ${pin.area}`}
              aria-pressed={selectedPinId === pin.id}
              onClick={() => setSelectedPinId(pin.id)}
              className={`map-pin ${selectedPinId === pin.id ? 'map-pin-selected' : ''}`}
              style={{ left: pin.x, top: pin.y }}
            >
              <span className={`map-pin-dot ${statusColors[pin.status]}`} />
              <span className="map-pin-label">{pin.label}</span>
            </button>
          ))}

          <div className="absolute bottom-4 left-4 right-4 z-10 rounded-2xl bg-white/85 backdrop-blur-lg border border-white/80 p-3 shadow-lg">
            <div className="flex items-start gap-3">
              <span className={`w-3 h-3 rounded-full mt-1 ${statusColors[selectedPin?.status || 'unknown']}`} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900">{selectedPin?.label ?? 'Pilih pin pada peta'}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedPin?.alias} · {selectedPin?.area}</p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><Clock3 className="w-3 h-3" />{selectedPin?.updated} · laporan pengguna</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Pin demo kedaluwarsa dalam {selectedPin?.expiresIn}</p>
              </div>
              {selectedPin && (
                <button type="button" onClick={() => { setReportPin(selectedPin); setReportSubmitted(false); }} className="text-xs text-slate-500 hover:text-rose-700 font-semibold">
                  Laporkan
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className={`glass-card w-full lg:w-[340px] p-4 space-y-4 ${showList ? '' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-slate-900">Laporan sekitar</h2>
              <p className="text-xs text-slate-500 mt-0.5">{visiblePins.length} pin simulasi · waktu pembaruan ditampilkan</p>
            </div>
            <button type="button" onClick={() => setShowList(false)} className="lg:hidden icon-action" aria-label="Kembali ke peta">
              <X className="w-4 h-4" />
            </button>
          </div>

          <label className="block text-xs font-bold text-slate-600">
            Area
            <select value={area} onChange={event => setArea(event.target.value)} className="form-control mt-1">
              <option>Semua area</option>
              <option>Sukajadi</option>
              <option>Cempaka</option>
              <option>Bandung Utara</option>
            </select>
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ['all', 'Semua'],
              ['help', 'Butuh bantuan'],
              ['checking', 'Memeriksa'],
              ['safe', 'Terkonfirmasi']
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveFilter(id)} className={`filter-chip ${activeFilter === id ? 'filter-chip-active' : ''}`}>
                {id === 'all' && <Filter className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {visiblePins.map(pin => (
              <button
                key={pin.id}
                type="button"
                onClick={() => { setSelectedPinId(pin.id); setShowList(false); }}
                className={`w-full text-left rounded-2xl border p-3 transition-all ${selectedPinId === pin.id ? 'border-blue-300 bg-blue-50/70' : 'border-white/80 bg-white/55 hover:bg-white/85'}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColors[pin.status]}`} />
                  <span className="text-sm font-bold text-slate-900">{pin.label}</span>
                </span>
                <span className="block text-xs text-slate-600 mt-1 ml-[18px]">{pin.alias} · {pin.area}</span>
                <span className="block text-[11px] text-slate-500 mt-1 ml-[18px]">{pin.updated} · belum diverifikasi</span>
              </button>
            ))}
            {visiblePins.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">Belum ada laporan untuk filter ini.</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3">
            {[
              ['help', 'Butuh bantuan'],
              ['checking', 'Memeriksa kondisi'],
              ['safe', 'Konfirmasi aman'],
              ['unknown', 'Belum dikonfirmasi']
            ].map(([status, label]) => (
              <span key={status} className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />{label}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
        <p className="text-xs leading-relaxed text-amber-950">
          Laporan pada peta ini tidak menggantikan informasi petugas. Jika ada bahaya langsung, hubungi layanan darurat setempat dan ikuti arahan petugas. <strong>Data peta ini simulasi, bukan kondisi real-time.</strong>
        </p>
      </div>

      {reportPin && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm p-4 grid place-items-center" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeReport(); }}>
          <section className="glass-card w-full max-w-md p-5 space-y-4 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Identitas pelapor tetap privat</p>
                <h2 id="report-title" className="text-lg font-extrabold text-slate-900 mt-2">Laporkan pin</h2>
                <p className="text-xs text-slate-600 mt-1">{reportPin.alias} · {reportPin.area}</p>
              </div>
              <button type="button" onClick={closeReport} className="icon-action" aria-label="Tutup formulir laporan"><X className="w-4 h-4" /></button>
            </div>
            {reportSubmitted ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900">
                <strong>Laporan demo tercatat.</strong> Pin ini akan ditinjau dalam simulasi; identitas pelapor tidak ditampilkan.
              </div>
            ) : (
              <>
                <label className="block text-xs font-bold text-slate-700">
                  Alasan laporan
                  <select value={reportReason} onChange={event => setReportReason(event.target.value)} className="form-control mt-1">
                    {reportReasons.map(reason => <option key={reason}>{reason}</option>)}
                  </select>
                </label>
                <p className="text-xs text-slate-500">Pelaporan pada prototype ini hanya simulasi dan tidak menghubungi moderator sungguhan.</p>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeReport} className="secondary-action">{reportSubmitted ? 'Tutup' : 'Batal'}</button>
              {!reportSubmitted && <button type="button" onClick={() => setReportSubmitted(true)} className="danger-action">Kirim laporan demo</button>}
            </div>
          </section>
        </div>
      )}
      <div className="sr-only"><Users /> Laporan keselamatan dari pengguna komunitas.</div>
    </div>
  );
}
