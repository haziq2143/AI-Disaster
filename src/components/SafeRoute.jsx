import React, { useState } from 'react';
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
  PhoneCall
} from 'lucide-react';
import { INITIAL_EVACUATION_POINTS } from '../data/mockData';

export default function SafeRoute({ 
  hazardData, 
  onBack, 
  onNavigateScreen 
}) {
  const [selectedPointId, setSelectedPointId] = useState('ev-1');
  const [hasLocationConsent, setHasLocationConsent] = useState(true);

  const selectedPoint = INITIAL_EVACUATION_POINTS.find(p => p.id === selectedPointId) || INITIAL_EVACUATION_POINTS[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D47A1] bg-[#E3F2FD] px-2.5 py-1 rounded-md">
            Screen 08: Safe Route & Titik Evakuasi
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Rute & Posko Evakuasi Terverifikasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sesuai PRD 4.6 & 12.3: Data simulasi diberi label. Rute tak terverifikasi TIDAK berlabel 'aman'.
          </p>
        </div>
      </div>

      {/* Interactive Mock Map Canvas */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#2196F3] bg-slate-900 shadow-lg text-white">
        {/* Map Header Status Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 text-xs font-medium">
            <span className="px-2 py-0.5 bg-[#0D47A1] text-white text-[10px] font-bold rounded">PETA SIMULASI</span>
            <span className="text-slate-300">Radius Aman ~1.5 km</span>
          </div>

          <div className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            <span>GPS Area: Aktif</span>
          </div>
        </div>

        {/* Visual Map Grid Canvas (Vector schematic styled aesthetic) */}
        <div className="h-64 sm:h-72 w-full bg-gradient-to-b from-slate-950 via-slate-900 to-[#0A192F] relative p-6 flex flex-col justify-between overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          {/* Hazard Zone Water / Fire overlay illustration */}
          <div className="absolute -bottom-10 -left-10 w-52 h-44 rounded-full bg-blue-500/20 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-6 left-12 px-3 py-1 bg-rose-950/80 border border-rose-500/40 rounded-lg text-[10px] text-rose-300 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Zona Genangan / Berisiko (Hindari)</span>
          </div>

          {/* User Location Pin */}
          <div className="absolute bottom-16 left-1/4 -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-500/40 animate-ping"></div>
            <div className="absolute -top-1 w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-md"></div>
            <span className="mt-4 px-2 py-0.5 bg-slate-900/90 text-white text-[10px] font-bold rounded shadow-md border border-slate-700 whitespace-nowrap">
              Lokasi Anda
            </span>
          </div>

          {/* Dotted path to Evacuation Point 1 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path
              d="M 160 170 Q 240 130 360 80"
              fill="transparent"
              stroke="#2196F3"
              strokeWidth="3"
              strokeDasharray="6,6"
              className="animate-pulse"
            />
          </svg>

          {/* Evacuation Point Pins */}
          <div className="absolute top-12 right-1/4 flex flex-col items-center cursor-pointer" onClick={() => setSelectedPointId('ev-1')}>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="mt-1 px-2.5 py-0.5 bg-emerald-950/90 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/50 shadow whitespace-nowrap">
              Posko RW 04 (350m)
            </span>
          </div>

          <div className="absolute top-10 left-12 flex flex-col items-center opacity-70 cursor-pointer" onClick={() => setSelectedPointId('ev-2')}>
            <div className="w-7 h-7 rounded-xl bg-[#2196F3] text-white flex items-center justify-center font-bold text-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="mt-1 px-2 py-0.5 bg-slate-900/90 text-slate-300 text-[9px] rounded">
              Kecamatan (1.2km)
            </span>
          </div>

          <div className="absolute top-28 right-8 flex flex-col items-center opacity-60 cursor-pointer" onClick={() => setSelectedPointId('ev-3')}>
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="mt-1 px-2 py-0.5 bg-slate-900/90 text-amber-300 text-[9px] rounded">
              Stadion (Rute Belum Terverifikasi)
            </span>
          </div>
        </div>

        {/* Map Bottom Hint */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-[#90CAF9]" />
            <span>Pilih salah satu posko di bawah untuk rincian jalur:</span>
          </span>
          <span className="text-[11px] text-slate-400">Jalur Pejalan Kaki Diprioritaskan</span>
        </div>
      </div>

      {/* Evacuation Point Card Selector */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
          <span>Daftar Titik Kumpul / Posko Evakuasi:</span>
          <span className="text-xs text-slate-500 font-normal">Pilih untuk detail panduan jalan</span>
        </h3>

        <div className="space-y-3">
          {INITIAL_EVACUATION_POINTS.map((point) => {
            const isSelected = point.id === selectedPointId;
            const isVerified = point.status === 'TERVERIFIKASI';

            return (
              <div
                key={point.id}
                onClick={() => setSelectedPointId(point.id)}
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

                {/* Extended Details for selected item */}
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

                    {!isVerified && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-medium leading-relaxed">
                        ⚠️ <strong>Peringatan Keselamatan:</strong> Jangan menuju lokasi ini sebelum ada arahan petugas BPBD di persimpangan. Selalu prioritaskan titik yang terverifikasi.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fallback Statement (PRD 4.6 & 6.4: Jangan mengarang rute jika data hilang) */}
      <div className="p-4 bg-[#E3F2FD] rounded-2xl border border-[#90CAF9] text-xs text-[#0D47A1] space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-[#2196F3]" />
          <span>Prinsip Keselamatan Navigasi (PRD 4.6):</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Jika kondisi lapangan terhalang banjir mendadak, pohon tumbang, atau jaringan internet terputus, <strong>ikuti instruksi petugas patroli dan relawan setempat</strong>. Sistem tidak mengarang rute darurat secara fiktif.
        </p>
      </div>

      {/* Navigation */}
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
          onClick={() => onNavigateScreen('checklist')}
          className="flex items-center gap-2 px-6 py-3 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <span>Lanjut ke Tas Siaga Checklist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
