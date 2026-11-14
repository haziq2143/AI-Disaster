'use client';

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
  Radio,
  ShieldCheck,
  Maximize2,
  X,
  Layers
} from 'lucide-react';

export default function BmkgAlertBanner({ onLocateCoordinates }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showShakemapModal, setShowShakemapModal] = useState(false);

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
      <div className="bg-white/80 border border-slate-200/90 rounded-3xl p-4 flex items-center justify-between text-xs text-slate-500 shadow-xs animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Activity className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Menghubungkan ke Sensor BMKG...</p>
            <p className="text-[11px] text-slate-400">Memeriksa radar kegempaan nasional terkini</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return null;
  }

  if (!data) return null;

  const mag = parseFloat(data.magnitude) || 0;
  const isHighMagnitude = mag >= 5.0;
  const isSevere = mag >= 6.5;
  const rawPotensi = (data.potensi || '').toLowerCase();
  const hasTsunamiPotential = rawPotensi.includes('tsunami') && !rawPotensi.includes('tidak berpotensi');

  // Interpretasi kedalaman untuk warga umum
  const depthNum = parseFloat((data.kedalaman || '').replace(/[^0-9.]/g, '')) || 0;
  const depthCategory = depthNum <= 60 
    ? 'Gempa Dangkal (Guncangan Lebih Terasa)' 
    : depthNum <= 300 
      ? 'Gempa Menengah' 
      : 'Gempa Dalam';

  return (
    <>
      <div className={`rounded-3xl border transition-all duration-300 shadow-sm overflow-hidden ${
        hasTsunamiPotential 
          ? 'bg-gradient-to-b from-rose-50/95 via-white to-white border-2 border-rose-400 ring-4 ring-rose-500/10' 
          : isSevere
            ? 'bg-gradient-to-b from-red-50/90 via-white to-white border-2 border-red-300'
            : isHighMagnitude
              ? 'bg-gradient-to-b from-amber-50/80 via-white to-white border border-amber-300'
              : 'bg-white/95 backdrop-blur-md border border-blue-200/90 hover:border-blue-300'
      }`}>
        {/* Header Bar */}
        <div className="p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Magnitude Badge (Prominent High-Contrast Pill) */}
            <div className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-2xl shrink-0 font-black shadow-sm ${
              hasTsunamiPotential || isSevere
                ? 'bg-rose-600 text-white animate-pulse'
                : isHighMagnitude
                  ? 'bg-amber-500 text-white'
                  : 'bg-gradient-to-tr from-blue-700 to-indigo-600 text-white'
            }`}>
              <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-85">MAG</span>
              <span className="text-base sm:text-lg font-black leading-none">{data.magnitude}</span>
            </div>

            {/* Title & Info Meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {/* Official Label without technical jargon */}
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs ${
                  hasTsunamiPotential || isSevere
                    ? 'bg-rose-600 text-white'
                    : 'bg-blue-700 text-white'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  <span>SENSOR GEMPA BMKG · REAL-TIME</span>
                </span>

                {/* Tsunami Status Pill */}
                {hasTsunamiPotential ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    POTENSI TSUNAMI
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Tidak Berpotensi Tsunami</span>
                  </span>
                )}

                {/* Timestamp */}
                <span className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{data.tanggal}, {data.jam} WIB</span>
                </span>
              </div>

              {/* Wilayah / Epicenter */}
              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug flex items-center gap-1.5 truncate" title={data.wilayah}>
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{data.wilayah}</span>
              </h3>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {data.coordinates && onLocateCoordinates && (
              <button
                type="button"
                onClick={() => onLocateCoordinates(data.coordinates)}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200 shadow-2xs hover-lift"
                title="Arahkan ke titik peta"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Lihat di Peta</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? 'Tutup' : 'Detail Lengkap'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
          <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-slate-200/80 space-y-4 text-xs text-slate-700 animate-fadeIn bg-slate-50/50">
            {/* 4-Column Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Metric 1: Kedalaman */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-600" />
                  Kedalaman Gempa
                </span>
                <span className="text-base font-black text-slate-900 block">{data.kedalaman}</span>
                <span className="text-[10px] font-medium text-slate-500 block">{depthCategory}</span>
              </div>

              {/* Metric 2: Koordinat */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  Episentrum GPS
                </span>
                <span className="text-sm font-black text-slate-900 font-mono block">{data.lintang} · {data.bujur}</span>
                <span className="text-[10px] font-medium text-slate-500 block">Koordinat Pusat Seismik</span>
              </div>

              {/* Metric 3: Potensi Tsunami */}
              <div className={`p-3.5 rounded-2xl border shadow-2xs space-y-1 ${
                hasTsunamiPotential 
                  ? 'bg-rose-50/90 border-rose-200' 
                  : 'bg-white border-slate-200/90'
              }`}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Waves className={`w-3 h-3 ${hasTsunamiPotential ? 'text-rose-600' : 'text-emerald-600'}`} />
                  Status Potensi Tsunami
                </span>
                <span className={`text-xs font-black leading-snug block ${hasTsunamiPotential ? 'text-rose-700' : 'text-slate-900'}`}>
                  {hasTsunamiPotential ? 'Peringatan Tsunami Dikeluarkan' : 'Tidak Berpotensi Tsunami'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 block truncate" title={data.potensi}>
                  {data.potensi || 'Berdasarkan pemodelan real-time BMKG'}
                </span>
              </div>

              {/* Metric 4: Intensitas Dirasakan (MMI) */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-600" />
                  Skala Guncangan (MMI)
                </span>
                <span className="text-xs font-black text-slate-900 block truncate" title={data.dirasakan || 'Belum ada laporan intensitas'}>
                  {data.dirasakan || 'Belum dilaporkan'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 block">Dampak getaran di daratan</span>
              </div>
            </div>

            {/* Shakemap Peta Guncangan Seismik Preview */}
            {data.shakemapUrl && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span className="text-xs font-black text-slate-900">
                      Visualisasi Peta Seismik & Guncangan (BMKG ShakeMap)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowShakemapModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Perbesar Peta</span>
                    </button>
                    <a 
                      href={data.shakemapUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-800 text-[11px] font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">Tab Baru</span>
                    </a>
                  </div>
                </div>

                <div 
                  onClick={() => setShowShakemapModal(true)}
                  className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-center p-3 hover:border-blue-300 transition-all max-h-72"
                >
                  <img 
                    src={data.shakemapUrl} 
                    alt={`Peta ShakeMap Gempa ${data.wilayah}`} 
                    className="max-h-64 w-auto object-contain mx-auto rounded-lg shadow-xs group-hover:scale-[1.01] transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 text-xs font-extrabold shadow-lg flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                      Klik untuk memperbesar
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Status & Manual Refresh */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>Sumber Resmi: Pusat Seismologi BMKG Indonesia · Pembaruan Otomatis Terhubung</span>
              </span>
              <button
                type="button"
                onClick={fetchBmkgAlert}
                disabled={loading}
                className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Memuat...' : 'Perbarui Sinyal'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shakemap Lightbox Modal */}
      {showShakemapModal && data.shakemapUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowShakemapModal(false)}
        >
          <div 
            className="relative bg-white rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  Peta Guncangan Seismik (BMKG ShakeMap)
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Gempa M {data.magnitude} · {data.wilayah}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShakemapModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200/80 flex items-center justify-center">
              <img 
                src={data.shakemapUrl} 
                alt={`Peta ShakeMap Gempa ${data.wilayah}`} 
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{data.tanggal}, {data.jam} WIB · Kedalaman: {data.kedalaman}</span>
              <a 
                href={data.shakemapUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Unduh Gambar Asli</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
