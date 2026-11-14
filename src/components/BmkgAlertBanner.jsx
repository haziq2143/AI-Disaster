import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Waves, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  RefreshCw,
  Radio
} from 'lucide-react';

export default function BmkgAlertBanner({ onLocateCoordinates }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchBmkgAlert = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/alerts/bmkg');
      const result = await res.json();

      if (result.success && result.data) {
        setData(result.data);
        setLastRefreshed(new Date());
      } else {
        setError(result.error || 'Data gempa tidak tersedia');
      }
    } catch (err) {
      setError('Koneksi ke layanan BMKG terputus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBmkgAlert();
    // Refresh otomatis setiap 2 menit jika tab aktif
    const interval = setInterval(fetchBmkgAlert, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-500 animate-pulse">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#2196F3] animate-spin" />
          <span>Memeriksa sinyal peringatan gempa BMKG...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return null; // Tidak mengganggu tampilan jika koneksi offline/gagal
  }

  if (!data) return null;

  const mag = parseFloat(data.magnitude) || 0;
  const isHighMagnitude = mag >= 5.0;
  const hasTsunamiPotential = data.potensi && data.potensi.toLowerCase().includes('tsunami') && !data.potensi.toLowerCase().includes('tidak berpotensi');

  return (
    <div className={`rounded-2xl border transition-all duration-200 shadow-sm ${
      hasTsunamiPotential 
        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500' 
        : isHighMagnitude
          ? 'bg-amber-50/90 border-amber-300'
          : 'bg-white border-blue-200'
    }`}>
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            hasTsunamiPotential
              ? 'bg-rose-600 text-white animate-pulse'
              : isHighMagnitude
                ? 'bg-amber-500 text-white'
                : 'bg-[#E3F2FD] text-[#0D47A1]'
          }`}>
            {hasTsunamiPotential ? <Waves className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                hasTsunamiPotential
                  ? 'bg-rose-700 text-white'
                  : 'bg-[#0D47A1] text-white'
              }`}>
                BMKG TEWS · LIVE
              </span>
              <span className="text-xs font-black text-slate-900">
                Gempa Magnitudo {data.magnitude}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                • {data.tanggal}, {data.jam}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium truncate mt-0.5" title={data.wilayah}>
              {data.wilayah}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.coordinates && onLocateCoordinates && (
            <button
              type="button"
              onClick={() => onLocateCoordinates(data.coordinates)}
              className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-[#0D47A1] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Arahkan ke peta"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Peta</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/80 space-y-3 text-xs text-slate-700 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Kedalaman</span>
              <span className="font-bold text-slate-900 text-sm">{data.kedalaman}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Koordinat</span>
              <span className="font-bold text-slate-900 font-mono text-xs">{data.lintang} · {data.bujur}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 col-span-2">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Status Potensi</span>
              <span className={`font-bold ${hasTsunamiPotential ? 'text-rose-600' : 'text-slate-800'}`}>
                {data.potensi}
              </span>
            </div>
          </div>

          {data.dirasakan && (
            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Skala Dirasakan (MMI)</span>
              <p className="font-medium text-slate-800">{data.dirasakan}</p>
            </div>
          )}

          {data.shakemapUrl && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Peta Guncangan (Shakemap BMKG)</span>
              <a 
                href={data.shakemapUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-slate-200 max-h-48 hover:opacity-90 transition-opacity bg-black/5"
              >
                <img 
                  src={data.shakemapUrl} 
                  alt="Shakemap BMKG" 
                  className="w-full object-contain max-h-48 mx-auto"
                  loading="lazy"
                />
              </a>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-[#2196F3]" />
              Sumber resmi: BMKG Indonesia (Open Data API)
            </span>
            <button
              type="button"
              onClick={fetchBmkgAlert}
              className="text-[#0D47A1] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Perbarui</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
