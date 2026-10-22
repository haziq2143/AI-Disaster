'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  MapPinned,
  Radio,
  Eye,
  Users,
  Compass,
  Clock,
  ArrowRight,
  X,
  Filter,
  Navigation,
  Volume2,
  Bell,
  PhoneCall,
  CheckCircle2,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  HeartHandshake,
  Layers,
  RefreshCw,
  AlertOctagon,
  ShieldQuestion,
  LocateFixed
} from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { api } from '../services/api';

// Dynamically import Leaflet canvas on client side (no SSR pass) to prevent "window is not defined"
const LeafletMapCanvas = dynamic(() => import('./LeafletMapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] sm:min-h-[540px] rounded-3xl bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-500 animate-pulse">
      <Compass className="w-8 h-8 text-blue-600 animate-spin mb-2" />
      <span className="font-bold text-sm text-slate-700">Memuat Peta Leaflet & OpenStreetMap...</span>
      <span className="text-xs text-slate-500 mt-1">Menghubungkan sensor GPS perangkat & database geospasial</span>
    </div>
  )
});

export default function GlobalSafetyMap({
  isShareActive = true,
  setIsShareActive,
  safetyShareDetails,
  setSafetyShareDetails,
  hazardData,
  onNavigateScreen,
  onNavigateRoute
}) {
  // 1. Real Device GPS Geolocation
  const {
    coords: gpsCoords,
    permissionStatus,
    errorMessage: gpsErrorMessage,
    accuracyText,
    accuracyLevel,
    lastUpdated: gpsLastUpdated,
    retry: retryGps
  } = useGeolocation();

  // Coordinates: Actual device GPS when available, fallback to Bandung Sukajadi
  const userLat = gpsCoords?.lat ?? -6.8880;
  const userLng = gpsCoords?.lng ?? 107.5940;
  const isRealGpsActive = Boolean(gpsCoords);

  // 2. User Emergency Status & Precision Consent State
  const [userStatus, setUserStatus] = useState(
    safetyShareDetails?.status === 'help' ? 'help' : 'checking'
  );
  const [precisionConsent, setPrecisionConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentCheckbox, setConsentCheckbox] = useState(false);

  // 3. Perspective & View Controls
  const [perspective, setPerspective] = useState('me'); // 'me' vs 'public'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'darurat', 'posko', 'warga'
  const [selectedItem, setSelectedItem] = useState(null);
  const [showList, setShowList] = useState(false);

  // 4. Database Data
  const [dbMarkers, setDbMarkers] = useState({
    posko: [],
    warga: [],
    laporan_darurat: []
  });
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [mapDataError, setMapDataError] = useState(null);
  const [mapDataUpdatedAt, setMapDataUpdatedAt] = useState(null);
  const [mapTileError, setMapTileError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // 5. Leaflet Map Control Ref
  const mapControlRef = useRef(null);

  // 6. Audio/Visual Distress Broadcast Toast
  const [broadcastFeedback, setBroadcastFeedback] = useState(null);
  const [distressStatus, setDistressStatus] = useState('idle');

  // 7. Anti-Abuse Report Modal
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('Lokasi terlihat tidak akurat / anomali koordinat');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const isUserInDanger = userStatus === 'help' && precisionConsent;

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load database markers (with threshold check to prevent excessive fetches)
  const lastFetchedRef = useRef(null);
  const loadDatabaseMarkers = useCallback(async (lat, lng) => {
    setIsLoadingDb(true);
    setMapDataError(null);
    try {
      const response = await api.getMapMarkers(lat, lng);
      setDbMarkers({
        posko: response.data.posko || [],
        warga: response.data.warga || [],
        laporan_darurat: response.data.laporan_darurat || []
      });
      setMapDataUpdatedAt(response.timestamp);
    } catch (err) {
      console.warn('Gagal memuat marker dari database:', err);
      setMapDataError(err instanceof Error ? err.message : 'Data peta gagal dimuat.');
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  const handleRefreshMapData = () => {
    lastFetchedRef.current = { lat: userLat, lng: userLng };
    loadDatabaseMarkers(userLat, userLng);
  };

  useEffect(() => {
    const prev = lastFetchedRef.current;
    if (
      !prev ||
      Math.abs(prev.lat - userLat) > 0.001 ||
      Math.abs(prev.lng - userLng) > 0.001
    ) {
      lastFetchedRef.current = { lat: userLat, lng: userLng };
      loadDatabaseMarkers(userLat, userLng);
    }
  }, [userLat, userLng, loadDatabaseMarkers]);

  // "Gunakan Lokasi Saya" Button Handler
  const handleUseMyLocation = () => {
    if (!isRealGpsActive) {
      retryGps();
      setBroadcastFeedback('🛰️ Meminta akses sensor GPS perangkat...');
    } else {
      mapControlRef.current?.centerToUser(userLat, userLng);
      setBroadcastFeedback(`📍 Peta dipusatkan ke GPS aktual Anda (${userLat.toFixed(5)}, ${userLng.toFixed(5)}).`);
    }
    setTimeout(() => setBroadcastFeedback(null), 4500);
  };

  // Trigger Emergency Mode with Explicit Consent Check
  const handleOpenEmergencyConsent = () => {
    if (isUserInDanger) {
      // Toggle back to normal safe mode
      setUserStatus('checking');
      setPrecisionConsent(false);
      setConsentCheckbox(false);
      setDistressStatus('idle');
      if (setSafetyShareDetails) {
        setSafetyShareDetails(prev => ({
          ...prev,
          status: 'checking',
          displayMode: 'radius_1km'
        }));
      }
      setBroadcastFeedback('🛡️ Mode Normal Aktif: Koordinat presisi ditutup. Lokasi Anda kini kembali dilindungi lingkaran radius 1 km.');
      setTimeout(() => setBroadcastFeedback(null), 6000);
    } else {
      if (!isRealGpsActive) {
        setBroadcastFeedback('GPS belum tersedia, jadi PIN SOS presisi tidak dapat dibuat. Jika dalam bahaya, hubungi 112 secara langsung.');
        return;
      }
      // Require explicit consent before revealing precision GPS
      setShowConsentModal(true);
    }
  };

  // Confirm explicit precision consent
  const handleConfirmEmergencyConsent = () => {
    if (!consentCheckbox) return;
    setUserStatus('help');
    setPrecisionConsent(true);
    setDistressStatus('idle');
    setShowConsentModal(false);

    if (setSafetyShareDetails) {
      setSafetyShareDetails(prev => ({
        ...prev,
        status: 'help',
        displayMode: 'pin_sos'
      }));
    }
    if (setIsShareActive) {
      setIsShareActive(true);
    }

    setSelectedItem({
      type: 'user',
      name: 'Lokasi Anda (Mode Darurat)',
      lat: userLat,
      lng: userLng,
      status: 'help',
      notes: 'PIN presisi hanya ditampilkan pada prototipe dan tidak dikirim ke petugas.',
      accuracy: accuracyText
    });

    setBroadcastFeedback('PIN SOS ditampilkan pada peta prototipe. Ini tidak mengirim notifikasi atau meminta petugas datang; hubungi 112 jika membutuhkan bantuan segera.');
    setTimeout(() => setBroadcastFeedback(null), 7000);
  };

  const handleSendDistressSignal = async () => {
    if (!gpsCoords) {
      setDistressStatus('location-required');
      return;
    }

    setDistressStatus('sending');
    try {
      await api.submitEmergencyReport({
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        reporter_name: 'Pengguna aplikasi',
        hazard_type: hazardData?.type || 'darurat',
        urgency_level: 'KRITIS',
        needs_description: 'Pengguna mengaktifkan SOS dan meminta bantuan.',
        vulnerable_members: 'Belum diinformasikan',
        precision_consent: true
      });
      setDistressStatus('saved');
      await loadDatabaseMarkers(userLat, userLng);
    } catch (err) {
      console.error('Gagal mencatat status SOS:', err);
      setDistressStatus('failed');
    }
  };

  // Filtered list based on active filter
  const filteredList = useMemo(() => {
    if (activeFilter === 'posko') return dbMarkers.posko.map(p => ({ ...p, itemType: 'posko' }));
    if (activeFilter === 'warga') return dbMarkers.warga.map(w => ({ ...w, itemType: 'warga' }));
    if (activeFilter === 'darurat') return dbMarkers.laporan_darurat.map(l => ({ ...l, itemType: 'laporan_darurat' }));
    return [
      ...dbMarkers.laporan_darurat.map(l => ({ ...l, itemType: 'laporan_darurat' })),
      ...dbMarkers.posko.map(p => ({ ...p, itemType: 'posko' })),
      ...dbMarkers.warga.map(w => ({ ...w, itemType: 'warga' }))
    ];
  }, [dbMarkers, activeFilter]);

  // Nearby items within 1 km of user
  const nearbyItems = useMemo(() => {
    const list = [
      ...dbMarkers.posko.map(p => ({ ...p, itemType: 'posko' })),
      ...dbMarkers.warga.map(w => ({ ...w, itemType: 'warga' })),
      ...dbMarkers.laporan_darurat.map(l => ({ ...l, itemType: 'laporan_darurat' }))
    ];
    return list.filter(item => item.distanceMeters <= 1000);
  }, [dbMarkers]);

  const activeSelected = selectedItem || {
    type: 'user',
    name: !isRealGpsActive
      ? 'Lokasi contoh (Sukajadi)'
      : isUserInDanger
        ? 'Lokasi Anda (PIN SOS Presisi)'
        : 'Lokasi Anda (Radius 1 km Privasi)',
    lat: userLat,
    lng: userLng,
    status: userStatus,
    notes: isUserInDanger
      ? 'Lokasi presisi aktif untuk evakuasi darurat.'
      : isRealGpsActive
        ? 'Lokasi terlindungi dengan lingkaran radius perkiraan 1 km.'
        : 'GPS belum tersedia. Peta menampilkan area contoh Sukajadi, bukan lokasi perangkat Anda.',
    accuracy: accuracyText
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-28 sm:pb-16">
      {/* 1. Header with GPS & Leaflet OpenStreetMap Live Indicator */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="eyebrow">Peta Leaflet + OpenStreetMap</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider flex items-center gap-1.5 ${
              isRealGpsActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <Compass className={`w-3 h-3 ${isRealGpsActive ? 'text-emerald-600 animate-spin' : 'text-amber-600'}`} />
              <span>{isRealGpsActive ? 'LOKASI GPS TERSEDIA' : 'LOKASI GPS BELUM TERSEDIA'}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Peta Keselamatan Leaflet & OpenStreetMap
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Peta menggunakan OpenStreetMap. Data posko dan laporan pada prototipe ini bukan feed resmi real-time. SOS hanya mencatat laporan di prototipe dan tidak menghubungi petugas; untuk keadaan darurat, hubungi 112.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <a
            href="tel:112"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-extrabold text-rose-700 shadow-sm transition-colors hover:bg-rose-50"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Telepon 112
          </a>
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="secondary-action text-xs"
            title="Pusatkan peta ke koordinat GPS perangkat Anda"
          >
            <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
            <span>Gunakan Lokasi Saya</span>
          </button>

          <button
            type="button"
            onClick={handleOpenEmergencyConsent}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              isUserInDanger
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25 animate-pulse'
            }`}
          >
            {isUserInDanger ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Nonaktifkan SOS (Kembali Aman)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>⚠️ Saya Butuh Bantuan / SOS</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. GPS Status & Telemetry Bar */}
      <section className="glass-card p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full shrink-0 ${
              permissionStatus === 'granted'
                ? 'bg-emerald-500 animate-ping'
                : permissionStatus === 'denied'
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
            }`} />
            <span className="font-bold text-slate-800">
              Status GPS:{' '}
              <span className={permissionStatus === 'granted' ? 'text-emerald-700' : 'text-amber-800'}>
                {permissionStatus === 'granted'
                  ? 'Izin Diberikan'
                  : permissionStatus === 'denied'
                    ? 'Izin Ditolak Browser'
                    : permissionStatus === 'unavailable'
                      ? 'Lokasi Tidak Tersedia'
                      : permissionStatus === 'timeout'
                        ? 'GPS Timeout'
                        : 'Meminta Koordinat...'}
                </span>
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {isRealGpsActive && (
            <span className="text-slate-600">
              Akurasi:{' '}
              <strong className={`font-semibold ${accuracyLevel === 'high' ? 'text-emerald-700' : 'text-slate-800'}`}>
                {accuracyText}
              </strong>
            </span>
          )}

          <span className="text-slate-300 hidden sm:inline">|</span>

          <span className="text-slate-600">
            {isRealGpsActive ? (
              <>
                Koordinat:{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800">
                  {userLat.toFixed(5)}, {userLng.toFixed(5)}
                </code>
              </>
            ) : (
              <strong className="font-semibold text-amber-800">Lokasi contoh Sukajadi — bukan posisi Anda</strong>
            )}
          </span>

          {gpsLastUpdated && (
            <>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-blue-600" />
                Diperbarui: {gpsLastUpdated}
              </span>
            </>
          )}
        </div>

        {/* Retry GPS Button */}
        <div className="flex flex-wrap items-center gap-2">
          {gpsErrorMessage && (
            <span className="text-[11px] text-rose-700 font-semibold" role="status">
              {permissionStatus === 'denied'
                ? 'Izin lokasi belum diaktifkan. Klik tombol "Use your location?" atau ikon gembok di sebelah kiri URL browser, ubah ke "Allow", lalu klik "Perbarui GPS".'
                : permissionStatus === 'timeout'
                  ? 'GPS timeout. Pastikan Location Services aktif di Windows Settings.'
                  : gpsErrorMessage}
            </span>
          )}
          <button
            type="button"
            onClick={retryGps}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Hubungkan GPS</span>
          </button>
        </div>
      </section>

      {!isOnline && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-950" role="alert">
          <strong>Koneksi terputus.</strong> Data terbaru dan peta online mungkin tidak tersedia. Data yang masih terlihat bisa sudah lama; jangan mengandalkannya untuk keputusan evakuasi.
        </div>
      )}

      {isOnline && mapTileError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950" role="alert">
          Peta dasar gagal dimuat. Periksa koneksi; lokasi dan data di peta mungkin tidak lengkap.
        </div>
      )}

      {isOnline && mapDataError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950" role="alert">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span><strong>Data peta gagal diperbarui.</strong> {mapDataError} {mapDataUpdatedAt ? 'Data yang terlihat mungkin sudah lama.' : ''}</span>
            <button type="button" onClick={handleRefreshMapData} className="rounded-lg border border-amber-400 px-3 py-1.5 font-bold hover:bg-amber-100">
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Broadcast Alert Toast */}
      {broadcastFeedback && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-start gap-3 shadow-lg transition-all animate-fadeIn ${
          isUserInDanger
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}>
          {isUserInDanger ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="leading-relaxed">{broadcastFeedback}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setBroadcastFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dual Perspective Banner & Controls */}
      <section className="glass-card p-4 sm:p-5 space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3 text-xs leading-relaxed text-blue-950 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-700" />
          <p>
            <strong>Data prototipe lokal</strong> · Contoh posko dan laporan ini tidak terhubung ke feed resmi real-time. Waktu di bawah menunjukkan waktu data diambil dari prototipe, bukan waktu verifikasi lapangan. {!isRealGpsActive && 'Jarak dihitung dari area contoh Sukajadi, bukan lokasi Anda.'}
            {mapDataUpdatedAt && (
              <span className="block mt-1 text-blue-800">
                Data diambil: {new Date(mapDataUpdatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          {/* Switcher A: Sudut Pandang (Perspective) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Pilih Sudut Pandang Tampilan Peta:
            </label>
            <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200/90 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPerspective('me')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  perspective === 'me'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>Sudut Pandang Saya (Korban/Warga)</span>
              </button>
              <button
                type="button"
                onClick={() => setPerspective('public')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  perspective === 'public'
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sudut Pandang Warga Lain (Publik)</span>
              </button>
            </div>
          </div>

          {/* Switcher B: Mode Lokasi Cepat */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              Mode Lokasi Anda:
            </label>
            <div className="inline-flex rounded-xl p-1 bg-slate-100/90 border border-slate-200/90 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setUserStatus('checking');
                  setPrecisionConsent(false);
                  setConsentCheckbox(false);
                  setDistressStatus('idle');
                  if (setSafetyShareDetails) {
                    setSafetyShareDetails(prev => ({ ...prev, status: 'checking', displayMode: 'radius_1km' }));
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isUserInDanger
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Normal (Radius 1km Privasi)</span>
              </button>
              <button
                type="button"
                onClick={handleOpenEmergencyConsent}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isUserInDanger
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-200" />
                <span>Butuh Bantuan (PIN Presisi SOS)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Requirement 8 & 9: Verification Disclaimer Notice */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs leading-relaxed text-amber-950 flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Batasan data:</strong> Koordinat dan radius pada peta adalah visualisasi prototipe. Data contoh tidak terhubung ke sumber resmi atau verifikasi petugas secara real-time. PIN SOS juga tidak mengirim notifikasi; untuk bantuan nyata, telepon 112.
          </div>
        </div>
      </section>

      {/* 3. Main Interactive Map & Vicinity Layout */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-blue-100 bg-white/70 p-1.5 lg:hidden" role="tablist" aria-label="Tampilan peta dan data">
        <button
          type="button"
          role="tab"
          aria-selected={!showList}
          onClick={() => setShowList(false)}
          className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${!showList ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
        >
          Peta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showList}
          onClick={() => setShowList(true)}
          className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${showList ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
        >
          Data & bantuan
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* Map Section Container */}
        <section 
          className={`${showList ? 'hidden lg:flex' : 'flex'} glass-card relative min-h-[420px] sm:min-h-[560px] overflow-hidden p-4 rounded-3xl border border-white/80 shadow-xl flex-col justify-between`}
          aria-label="Peta Leaflet OpenStreetMap keselamatan bencana"
        >
          {/* Top Over-Map Toolbar */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-xl border border-white/80 bg-white/95 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {isRealGpsActive ? 'Lokasi GPS Anda' : 'Lokasi contoh: Sukajadi, Bandung'}
                </span>
              </span>

              {isUserInDanger ? (
                <span className="rounded-xl border border-rose-300 bg-rose-500 text-white px-3 py-1.5 text-xs font-bold shadow-md flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>PIN Presisi Darurat Aktif</span>
                </span>
              ) : isRealGpsActive ? (
                <span className="rounded-xl border border-blue-200 bg-blue-50/95 text-blue-900 px-3 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span>Lingkaran Radius 1 km (Privasi)</span>
                </span>
              ) : (
                <span className="rounded-xl border border-amber-200 bg-amber-50/95 text-amber-900 px-3 py-1.5 text-xs font-bold shadow-sm flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Tidak menampilkan titik GPS pengguna</span>
                </span>
              )}

              <span className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-2.5 py-1 text-[11px] font-bold shadow-sm flex items-center gap-1">
                Leaflet + OpenStreetMap
              </span>
            </div>

            {/* Map Action Buttons (Zoom & Reset) */}
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-white/90 shadow-sm">
              <button
                type="button"
                onClick={() => mapControlRef.current?.zoomIn()}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 grid place-items-center text-slate-700 cursor-pointer"
                aria-label="Perbesar peta"
                title="Perbesar Peta"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => mapControlRef.current?.zoomOut()}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 grid place-items-center text-slate-700 cursor-pointer"
                aria-label="Perkecil peta"
                title="Perkecil Peta"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 grid place-items-center text-slate-700 cursor-pointer"
                aria-label="Pusatkan ke lokasi saya"
                title="Pusatkan Peta ke Lokasi GPS Saya"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Leaflet + OpenStreetMap Canvas */}
          <div className="absolute inset-0 z-0">
            <LeafletMapCanvas
              userLat={userLat}
              userLng={userLng}
              isRealGpsActive={isRealGpsActive}
              isUserInDanger={isUserInDanger}
              userStatus={userStatus}
              accuracyText={accuracyText}
              poskoList={dbMarkers.posko}
              wargaList={dbMarkers.warga}
              laporanDaruratList={dbMarkers.laporan_darurat}
              selectedItem={activeSelected}
              onSelectItem={setSelectedItem}
              onNavigateRoute={onNavigateRoute}
              onTileError={setMapTileError}
              mapControlRef={mapControlRef}
              perspective={perspective}
            />
          </div>

          {/* Perspective Active Indicator Banner on top of Map */}
          <div className="absolute top-14 left-3 right-3 z-10 pointer-events-none">
            {perspective === 'public' ? (
              <div className="p-2.5 rounded-2xl bg-indigo-950/90 text-indigo-100 border border-indigo-400/60 shadow-xl backdrop-blur-md flex items-center justify-between gap-2 text-xs font-bold animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-300 shrink-0" />
                  <span>Mode Publik Aktif: Lokasi rumah Anda disamarkan dalam radius privasi 1 km (PRD 4.5).</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-indigo-700 text-white text-[9px] font-extrabold uppercase shrink-0">
                  Tampilan Warga Lain
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-blue-950/90 text-blue-100 border border-blue-400/60 shadow-xl backdrop-blur-md flex items-center justify-between gap-2 text-xs font-bold animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-300 animate-pulse shrink-0" />
                  <span>Mode Pribadi: Menampilkan lokasi presisi GPS Anda & radar fasilitas evakuasi terdekat.</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white text-[9px] font-extrabold uppercase shrink-0">
                  Tampilan Saya
                </span>
              </div>
            )}
          </div>

          {/* Bottom Card: Selected Pin Details */}
          <div className="relative z-20 mt-auto pt-4 pointer-events-auto">
            <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 p-4 shadow-xl">
              <div className="space-y-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl grid place-items-center shrink-0 shadow-md ${
                    activeSelected?.itemType === 'laporan_darurat' || activeSelected?.status === 'help'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : activeSelected?.itemType === 'posko'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {activeSelected?.itemType === 'laporan_darurat' || activeSelected?.status === 'help' ? (
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    ) : activeSelected?.itemType === 'posko' ? (
                      <HeartHandshake className="w-6 h-6" />
                    ) : (
                      <MapPin className="w-6 h-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="min-w-0 break-words font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                        {activeSelected?.name || activeSelected?.alias || activeSelected?.reporter_name}
                      </h3>
                      <span className={`px-2 py-0.2 text-[10px] font-bold rounded-md ${
                        activeSelected?.itemType === 'laporan_darurat' || activeSelected?.status === 'help'
                          ? 'bg-rose-600 text-white'
                          : activeSelected?.itemType === 'posko'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                      }`}>
                        {activeSelected?.itemType === 'laporan_darurat'
                          ? `🚨 LAPORAN DEMO (${activeSelected?.urgency_level || 'KRITIS'})`
                          : activeSelected?.itemType === 'posko'
                            ? 'POSKO CONTOH'
                            : activeSelected?.type === 'user' && !isRealGpsActive
                              ? 'LOKASI CONTOH'
                              : activeSelected?.type === 'user'
                                ? 'LOKASI SAYA'
                                : 'WARGA CONTOH'}
                      </span>
                    </div>

                    <p className="break-words text-xs text-slate-600 mt-1">
                      {activeSelected?.needs_description || activeSelected?.notes || activeSelected?.address || (!isRealGpsActive && activeSelected?.type === 'user' ? 'GPS belum tersedia. Peta menampilkan area contoh Sukajadi, bukan lokasi perangkat Anda.' : 'Terdata dalam database prototipe lokal.')}
                    </p>

                    {activeSelected?.vulnerable_members && (
                      <p className="text-[11px] font-semibold text-rose-700 mt-1">
                        Keluarga rentan: {activeSelected.vulnerable_members}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3 h-3 text-blue-600" />
                        {activeSelected?.reported_at || activeSelected?.updated_at || activeSelected?.verified_at || 'Waktu pada data tidak tersedia'}
                      </span>
                      <span>•</span>
                      <span className="font-medium">
                        {activeSelected?.type === 'user' && !isRealGpsActive
                          ? 'GPS belum tersedia'
                          : `Format Tampilan: ${activeSelected?.status === 'help' ? '🔴 PIN Presisi' : '🔵 Radius Perkiraan 1 km'}`}
                      </span>
                      {activeSelected?.distanceFormatted && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-blue-700">
                            Jarak: {activeSelected.distanceFormatted} ({activeSelected.estWalkTime} jalan kaki)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-3">
                  {activeSelected?.itemType === 'laporan_darurat' && (
                    <a
                      href="tel:112"
                      className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow transition-colors hover:bg-rose-700 sm:w-auto"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Hubungi layanan darurat 112</span>
                    </a>
                  )}

                  {activeSelected?.type !== 'user' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateRoute) {
                          onNavigateRoute(activeSelected);
                        } else {
                          onNavigateScreen('route');
                        }
                      }}
                      className={`w-full justify-center text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer sm:w-auto ${
                        activeSelected?.itemType === 'laporan_darurat'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'primary-action'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>
                        {activeSelected?.itemType === 'laporan_darurat'
                          ? 'Rute Penyelamatan'
                          : activeSelected?.itemType === 'posko'
                            ? 'Rute ke Posko'
                            : 'Arahkan Rute'}
                      </span>
                    </button>
                  )}

                  {activeSelected?.type !== 'user' && (
                    <button
                      type="button"
                      onClick={() => { setReportTarget(activeSelected); setReportSubmitted(false); }}
                      className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-700 cursor-pointer sm:w-auto"
                    >
                      Laporkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prototype data and emergency actions */}
        <aside className={`${showList ? 'block' : 'hidden lg:block'} space-y-4`}>
          {/* SPECIAL DISTRESS RADAR CARD: When user is in danger or needs help */}
          <div className={`rounded-3xl p-5 border shadow-lg transition-all ${
            isUserInDanger
              ? 'bg-gradient-to-b from-rose-900 to-rose-950 text-white border-rose-700'
              : 'glass-card text-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${
                  isUserInDanger
                    ? 'bg-rose-500 text-white'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {isUserInDanger ? '🚨 STATUS SOS PROTOTIPE' : '📡 DATA SEKITAR'}
                </span>
                <h2 className="text-base font-extrabold tracking-tight">
                  {isUserInDanger
                    ? `${nearbyItems.length} Contoh titik dalam radius 1 km`
                    : isRealGpsActive
                      ? 'Data sekitar (Radius 1 km)'
                      : 'Data sekitar lokasi contoh'}
                </h2>
                <p className={`text-xs ${isUserInDanger ? 'text-rose-200' : 'text-slate-600'}`}>
                  {isUserInDanger
                    ? 'PIN presisi hanya aktif pada peta prototipe. Lokasi tidak dikirim ke petugas.'
                    : isRealGpsActive
                      ? 'Jarak dihitung dari GPS perangkat; isi peta bukan data resmi real-time.'
                      : 'GPS belum tersedia. Jarak memakai area contoh Sukajadi.'}
                </p>
              </div>

              <div className={`w-10 h-10 rounded-2xl grid place-items-center shrink-0 ${
                isUserInDanger ? 'bg-rose-800/80 text-rose-200' : 'bg-blue-100 text-blue-800'
              }`}>
                <Radio className={`w-5 h-5 ${isUserInDanger ? 'animate-pulse text-white' : ''}`} />
              </div>
            </div>

            {/* Prototype report and direct emergency contact */}
            {isUserInDanger && (
              <div className="mt-4 pt-4 border-t border-rose-800/70 space-y-2">
                <button
                  type="button"
                  onClick={handleSendDistressSignal}
                  disabled={distressStatus === 'sending' || distressStatus === 'saved'}
                  className="w-full py-3 px-4 rounded-xl bg-white text-rose-900 font-extrabold text-xs shadow-lg hover:bg-rose-50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>
                    {distressStatus === 'sending'
                      ? 'Mencatat laporan...'
                      : distressStatus === 'saved'
                        ? 'Laporan tercatat di prototipe'
                        : distressStatus === 'failed'
                          ? 'Coba catat laporan lagi'
                          : 'Catat status SOS (prototipe)'}
                  </span>
                </button>
                <p className="text-[11px] leading-relaxed text-rose-100" role={distressStatus === 'failed' || distressStatus === 'location-required' ? 'alert' : 'status'}>
                  {distressStatus === 'saved'
                    ? 'Laporan tersimpan di database prototipe lokal. Tidak ada notifikasi atau dispatch petugas yang dikirim.'
                    : distressStatus === 'failed'
                      ? 'Laporan gagal dicatat. Belum ada bantuan yang dihubungi; coba lagi atau telepon layanan darurat.'
                      : distressStatus === 'location-required'
                        ? 'Lokasi GPS belum tersedia sehingga laporan tidak dicatat. Hubungi 112 secara langsung.'
                        : 'Tombol ini hanya mencatat laporan pada prototipe; tidak menghubungi tim SAR atau petugas.'}
                </p>
                <a
                  href="tel:112"
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-lg hover:bg-rose-500 flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  Hubungi layanan darurat 112
                </a>
              </div>
            )}
          </div>

          {/* Database Items List Card */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Data Peta Prototipe</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  {isLoadingDb ? 'Memuat…' : `${filteredList.length} entitas`}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshMapData}
                  disabled={isLoadingDb}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-blue-200 bg-white/80 px-2 text-[11px] font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-60"
                  aria-label="Perbarui data peta"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingDb ? 'animate-spin' : ''}`} />
                  Perbarui
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                ['all', 'Semua'],
                ['darurat', 'Laporan Darurat'],
                ['posko', 'Posko Evakuasi'],
                ['warga', 'Warga Sekitar']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`filter-chip ${activeFilter === key ? 'filter-chip-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Scrollable Items List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredList.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    if (mapControlRef.current && item.lat && item.lng) {
                      mapControlRef.current.flyTo(item.lat, item.lng, 16);
                    }
                  }}
                  className={`w-full text-left rounded-2xl p-3 border transition-all cursor-pointer ${
                    selectedItem?.id === item.id
                      ? 'border-blue-400 bg-blue-50/80 shadow-sm ring-1 ring-blue-300'
                      : 'border-white/80 bg-white/60 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.itemType === 'laporan_darurat'
                          ? 'bg-rose-500 animate-ping'
                          : item.itemType === 'posko'
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                      }`} />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {item.name || item.alias || item.reporter_name}
                      </span>
                    </div>
                    {item.distanceFormatted && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                        {item.distanceFormatted}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[11px] text-slate-600 line-clamp-1">
                    {item.needs_description || item.facilities?.join(', ') || item.notes || item.address}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                      Sampel prototipe
                    </span>
                    <span className="text-slate-500 text-right">
                      {item.reported_at || item.updated_at || item.verified_at || item.estWalkTime || ''}
                    </span>
                  </div>
                </button>
              ))}

              {filteredList.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  {isLoadingDb ? 'Memuat data peta…' : 'Tidak ada data untuk filter ini pada prototipe.'}
                </p>
              )}
            </div>

            {/* Emergency Hotline Direct Bar */}
            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <a href="tel:115" className="font-bold flex items-center gap-1.5 hover:text-blue-800">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                SAR 115
              </a>
              <a href="tel:112" className="font-bold flex items-center gap-1.5 hover:text-rose-700">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Darurat 112
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. EXPLICIT PRECISION LOCATION CONSENT MODAL (Requirement 8) */}
      {showConsentModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md p-4 grid place-items-center animate-fadeIn" 
          role="presentation"
          onMouseDown={e => { if (e.target === e.currentTarget) setShowConsentModal(false); }}
        >
          <section className="glass-card w-full max-w-lg p-6 space-y-5 shadow-2xl bg-white" role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 grid place-items-center shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="eyebrow bg-rose-50 text-rose-800 border-rose-200">
                    Konfirmasi Persetujuan Eksplisit
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                    Buka Lokasi Presisi untuk Mode Darurat?
                  </h2>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConsentModal(false)} 
                className="icon-action cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                <p className="font-bold">
                  ⚠️ Perhatian Keselamatan & Privasi:
                </p>
                <p>
                  Dalam kondisi normal, posisi Anda disamarkan dengan <strong>lingkaran radius perkiraan 1 km</strong>. Namun dalam keadaan darurat atau butuh bantuan evakuasi, tim penolong membutuhkan <strong>titik koordinat GPS presisi</strong> perangkat Anda.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Batasan prototipe ini:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Radius 1 km akan dinonaktifkan sementara dan digantikan <strong>PIN Presisi Darurat</strong>.</li>
                  <li>PIN presisi hanya ditampilkan di prototipe lokal. Koordinat tidak disiarkan dan tidak dikirim ke petugas.</li>
                  <li>Untuk meminta bantuan nyata, hubungi layanan darurat 112 secara langsung.</li>
                  <li>Anda dapat mematikan mode darurat dan mengembalikan radius 1 km kapan saja setelah kondisi aman.</li>
                </ul>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentCheckbox}
                  onChange={e => setConsentCheckbox(e.target.checked)}
                  className="mt-0.5 accent-rose-600 w-4 h-4"
                />
                <span className="text-xs font-semibold text-rose-950">
                  Saya menyatakan sedang dalam kondisi darurat dan setuju menampilkan titik GPS presisi pada prototipe ini. Saya memahami bahwa persetujuan ini <strong>tidak menghubungi petugas</strong>.
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="secondary-action text-xs"
              >
                Batal (Tetap Radius 1 km)
              </button>
              <button
                type="button"
                onClick={handleConfirmEmergencyConsent}
                disabled={!consentCheckbox}
                className={`text-xs px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  consentCheckbox
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Setuju & Buka PIN Presisi</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* 5. Anti-Abuse Report Modal */}
      {reportTarget && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm p-4 grid place-items-center animate-fadeIn" 
          role="presentation" 
          onMouseDown={e => { if (e.target === e.currentTarget) setReportTarget(null); }}
        >
          <section className="glass-card w-full max-w-md p-6 space-y-4 shadow-2xl bg-white" role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="eyebrow">Anti-Abuse & Fake GPS Protection</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-2">Laporkan Titik / Status</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {reportTarget.name || reportTarget.alias || reportTarget.reporter_name}
                </p>
              </div>
              <button type="button" onClick={() => setReportTarget(null)} className="icon-action cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Simulasi laporan selesai
                </p>
                <p className="text-xs text-emerald-800">
                  Pada prototipe ini laporan tidak dikirim atau disimpan dan tidak masuk ke antrean moderator.
                </p>
              </div>
            ) : (
              <>
                <label className="block text-xs font-bold text-slate-700">
                  Alasan Laporan
                  <select 
                    value={reportReason} 
                    onChange={e => setReportReason(e.target.value)} 
                    className="form-control mt-1"
                  >
                    <option>Lokasi terlihat tidak akurat / mencurigakan</option>
                    <option>Indikasi Fake GPS / Mock Location</option>
                    <option>Spam atau laporan palsu</option>
                    <option>Kondisi bahaya sudah selesai / tidak sesuai</option>
                  </select>
                </label>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                  Ini hanya simulasi antarmuka; tidak ada data yang dikirim ke moderator atau petugas lapangan.
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setReportTarget(null)} className="secondary-action text-xs">
                {reportSubmitted ? 'Tutup' : 'Batal'}
              </button>
              {!reportSubmitted && (
                <button 
                  type="button" 
                  onClick={() => setReportSubmitted(true)} 
                  className="danger-action text-xs"
                >
                  Simulasikan Laporan
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
