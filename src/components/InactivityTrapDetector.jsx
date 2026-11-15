import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Radio, 
  AlertTriangle, 
  Check, 
  Clock, 
  Volume2, 
  Settings, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { calculateDistance } from '../lib/geoUtils';

export default function InactivityTrapDetector({
  userLat,
  userLng,
  isRealGpsActive,
  disasterZones = [],
  userName = 'Warga',
  onAutoTriggerSOS,
  onActivateBeacon
}) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false); // Demo: 20 detik; Normal: 30 menit (1800s)
  const [inactivitySeconds, setInactivitySeconds] = useState(0);
  const [inPreAlarm, setInPreAlarm] = useState(false);
  const [preAlarmCountdown, setPreAlarmCountdown] = useState(15);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  const lastCoordsRef = useRef({ lat: userLat, lng: userLng });
  const preAlarmIntervalRef = useRef(null);

  // Periksa apakah pengguna berada di dalam Zona Bencana Level 3 (AWAS) atau Level 2 (SIAGA)
  const activeZone = disasterZones.find(zone => {
    if (zone.status !== 'active') return false;
    if (zone.severity_level !== 'level_3_critical' && zone.severity_level !== 'level_2_warning') return false;
    const dist = calculateDistance(userLat, userLng, zone.lat, zone.lng);
    return dist <= (zone.radius_km * 1000);
  });

  const thresholdSeconds = isDemoMode ? 20 : 1800; // 20 detik (demo) vs 30 menit (real)

  // Reset timer ke 0 saat ada gerakan nyata atau interaksi
  const resetInactivity = () => {
    setInactivitySeconds(0);
    if (inPreAlarm) {
      setInPreAlarm(false);
      setPreAlarmCountdown(15);
      if (preAlarmIntervalRef.current) clearInterval(preAlarmIntervalRef.current);
    }
  };

  // 1. Deteksi pergeseran koordinat GPS
  useEffect(() => {
    if (!lastCoordsRef.current.lat || !userLat) {
      lastCoordsRef.current = { lat: userLat, lng: userLng };
      return;
    }
    const displacement = calculateDistance(
      lastCoordsRef.current.lat,
      lastCoordsRef.current.lng,
      userLat,
      userLng
    );
    // Jika bergeser > 12 meter, anggap pengguna berpindah posisi
    if (displacement > 12) {
      lastCoordsRef.current = { lat: userLat, lng: userLng };
      resetInactivity();
    }
  }, [userLat, userLng]);

  // 2. Deteksi sensor gerak fisik (DeviceMotion Accelerometer) jika didukung
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const magnitude = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + (acc.z || 0)**2);
      // Guncangan fisik / langkah kaki yang terdeteksi
      if (magnitude > 14 || magnitude < 6) {
        resetInactivity();
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [inPreAlarm]);

  // 3. Inactivity Ticker Loop
  useEffect(() => {
    if (!isEnabled || hasAutoTriggered) return;

    // Aktifkan otomatis jika di dalam zona bahaya atau jika user mengaktifkan manual / demo
    const interval = setInterval(() => {
      setInactivitySeconds(prev => {
        const next = prev + 1;
        if (next >= thresholdSeconds && !inPreAlarm) {
          // Masuk fase pre-alarm (peringatan 15 detik sebelum auto-dispatch)
          setInPreAlarm(true);
          setPreAlarmCountdown(15);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEnabled, thresholdSeconds, inPreAlarm, hasAutoTriggered]);

  // 4. Pre-alarm Countdown Loop (15 detik)
  useEffect(() => {
    if (!inPreAlarm) return;

    preAlarmIntervalRef.current = setInterval(() => {
      setPreAlarmCountdown(prev => {
        if (prev <= 1) {
          clearInterval(preAlarmIntervalRef.current);
          triggerFullAutoRescue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (preAlarmIntervalRef.current) clearInterval(preAlarmIntervalRef.current);
    };
  }, [inPreAlarm]);

  // 5. Eksekusi Otomatis Penyelamatan Saat Waktu Habis
  const triggerFullAutoRescue = async () => {
    setInPreAlarm(false);
    setHasAutoTriggered(true);

    const reportPayload = {
      reporter_name: userName || 'Warga (Auto-PASS)',
      hazard_type: activeZone?.hazard_type || 'gempa',
      urgency_level: 'KRITIS',
      needs_description: `[AUTO-TRIGGER PASS] Korban terdeteksi TIDAK BERGERAK selama ${isDemoMode ? 'mode uji coba' : '> 30 menit'} di Zona Bencana ${activeZone?.name || 'Kritis'}. Terindikasi tertimbun reruntuhan atau tidak sadarkan diri. Sinyal suara & senter HP diaktifkan otomatis.`,
      lat: userLat,
      lng: userLng,
      precision_consent: true,
      is_auto_triggered: true
    };

    // Kirim laporan SOS otomatis ke server
    if (onAutoTriggerSOS) {
      await onAutoTriggerSOS(reportPayload);
    }

    // Nyalakan Peluit 3.000 Hz dan Senter SOS otomatis
    if (onActivateBeacon) {
      onActivateBeacon();
    }
  };

  const formattedInactivityMinutes = Math.floor(inactivitySeconds / 60);
  const formattedInactivitySeconds = inactivitySeconds % 60;

  return (
    <>
      {/* Floating Status Bar / Widget Inactivity Monitor */}
      <div className={`p-3.5 rounded-2xl border transition-all ${
        hasAutoTriggered
          ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
          : activeZone
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-white border-slate-200 text-slate-800'
      } shadow-xs`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              hasAutoTriggered
                ? 'bg-white text-rose-600 animate-bounce'
                : activeZone
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              <Radio className="w-4 h-4" />
            </div>

            <div className="min-w-0 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-slate-900">Deteksi Korban Terjebak (PASS)</span>
                {activeZone && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    ZONA AWAS
                  </span>
                )}
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    UJI COBA 20 DETIK
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5 truncate">
                {hasAutoTriggered 
                  ? 'Sinyal SOS & Peluit Otomatis Sedang Memancar!'
                  : `Diam tanpa gerak: ${formattedInactivityMinutes}m ${formattedInactivitySeconds}s / ${isDemoMode ? '20s' : '30m'}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
            {!hasAutoTriggered && (
              <button
                type="button"
                onClick={() => setIsDemoMode(!isDemoMode)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-[11px] cursor-pointer flex items-center justify-center text-center transition-all"
                title="Beralih ke mode simulasi cepat 20 detik"
              >
                {isDemoMode ? 'Mode Asli (30m)' : 'Simulasi Uji (20s)'}
              </button>
            )}

            {hasAutoTriggered ? (
              <button
                type="button"
                onClick={() => {
                  setHasAutoTriggered(false);
                  resetInactivity();
                }}
                className="col-span-2 sm:col-span-1 min-h-[38px] px-4 py-2 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 active:scale-95 shadow-sm cursor-pointer transition-all flex items-center justify-center text-center"
              >
                Saya Selamat / Matikan Alarm
              </button>
            ) : (
              <button
                type="button"
                onClick={resetInactivity}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Saya Bergerak</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PRE-ALARM FULLSCREEN MODAL (Hitung mundur 15 detik sebelum mengirim SOS & membunyikan sirine) */}
      {inPreAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border-4 border-rose-600 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Peringatan Korban Tidak Bergerak
              </span>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">
                Apakah Anda Baik-Baik Saja?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ponsel mendeteksi Anda tidak bergerak selama {isDemoMode ? '20 detik (simulasi)' : '30 menit'} di area bencana. Sinyal darurat SOS ke Tim SAR dan peluit akustik akan <strong>otomatis menyala</strong> dalam:
              </p>
            </div>

            {/* Big Countdown Clock */}
            <div className="py-4 bg-rose-50 rounded-2xl border-2 border-rose-300">
              <span className="font-mono text-5xl font-black text-rose-600">
                {preAlarmCountdown}
              </span>
              <span className="block text-[11px] font-bold text-rose-700 uppercase mt-1">
                Detik Menuju Pengiriman Otomatis
              </span>
            </div>

            {/* Shake Gesture Guidance */}
            <p className="text-[11px] font-bold text-slate-600 bg-slate-100 py-2 px-3 rounded-xl border border-slate-200">
              Goyangkan HP atau sentuh tombol di bawah untuk membatalkan
            </p>

            {/* Cancel / Confirm Safe Button */}
            <button
              type="button"
              onClick={resetInactivity}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl shadow-lg transition-transform transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>SAYA SELAMAT &amp; SADAR (BATALKAN ALARM)</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
