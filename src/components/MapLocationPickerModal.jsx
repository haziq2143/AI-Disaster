'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Crosshair, 
  X, 
  Check, 
  AlertTriangle, 
  Layers, 
  Radio, 
  Home,
  Navigation
} from 'lucide-react';

const QUICK_PRESETS = [
  { name: 'Pusat Kota Bandung (Alun-Alun)', lat: -6.9218, lng: 107.6070 },
  { name: 'Lembang (Sesar Lembang)', lat: -6.8168, lng: 107.6186 },
  { name: 'Dago Atas / Coblong', lat: -6.8732, lng: 107.6152 },
  { name: 'Baleendah (Area Banjir)', lat: -7.0019, lng: 107.6325 },
  { name: 'Cimahi Tengah', lat: -6.8723, lng: 107.5422 },
  { name: 'Ujung Berung / Bandung Timur', lat: -6.9114, lng: 107.6974 }
];

export default function MapLocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialRadius = 2.5,
  mode = 'zone', // 'zone' | 'posko'
  hazardType = 'gempa',
  severityLevel = 'level_3_critical',
  title
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const LRef = useRef(null);

  const defaultLat = Number(initialLat) && !isNaN(Number(initialLat)) ? Number(initialLat) : -6.9175;
  const defaultLng = Number(initialLng) && !isNaN(Number(initialLng)) ? Number(initialLng) : 107.6191;

  const [currentLat, setCurrentLat] = useState(defaultLat);
  const [currentLng, setCurrentLng] = useState(defaultLng);
  const [radiusKm, setRadiusKm] = useState(Number(initialRadius) || 2.5);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Reset coordinates whenever modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      const lat = Number(initialLat) && !isNaN(Number(initialLat)) ? Number(initialLat) : -6.9175;
      const lng = Number(initialLng) && !isNaN(Number(initialLng)) ? Number(initialLng) : 107.6191;
      setCurrentLat(lat);
      setCurrentLng(lng);
      setRadiusKm(Number(initialRadius) || 2.5);
      setGpsError('');
    }
  }, [isOpen, initialLat, initialLng, initialRadius]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !containerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      LRef.current = L;
      if (!isMounted || !containerRef.current) return;

      // Fix icon issues
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center: [currentLat, currentLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });
      mapInstanceRef.current = map;

      // Tile layer
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Marker
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        title: mode === 'zone' ? 'Pusat Zona Bencana' : 'Lokasi Posko'
      }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setCurrentLat(Number(pos.lat.toFixed(6)));
        setCurrentLng(Number(pos.lng.toFixed(6)));
      });

      // Circle for Zone
      if (mode === 'zone') {
        const circleColor = severityLevel === 'level_3_critical' ? '#e11d48' : severityLevel === 'level_2_warning' ? '#d97706' : '#2563eb';
        const circle = L.circle([currentLat, currentLng], {
          radius: radiusKm * 1000,
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.2,
          weight: 2
        }).addTo(map);
        circleRef.current = circle;
      }

      // Map Click to place marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const fixedLat = Number(lat.toFixed(6));
        const fixedLng = Number(lng.toFixed(6));
        setCurrentLat(fixedLat);
        setCurrentLng(fixedLng);
        marker.setLatLng([fixedLat, fixedLng]);
        if (circleRef.current) {
          circleRef.current.setLatLng([fixedLat, fixedLng]);
        }
      });

      // Invalidate size once rendered
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, [isOpen, mode, severityLevel]);

  // Update marker and circle position when lat/lng changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([currentLat, currentLng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([currentLat, currentLng]);
    }
  }, [currentLat, currentLng]);

  // Update circle radius when radius changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
      const circleColor = severityLevel === 'level_3_critical' ? '#e11d48' : severityLevel === 'level_2_warning' ? '#d97706' : '#2563eb';
      circleRef.current.setStyle({
        color: circleColor,
        fillColor: circleColor
      });
    }
  }, [radiusKm, severityLevel]);

  // Fetch Device GPS Location
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung geolokasi GPS.');
      return;
    }

    setIsGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGpsLoading(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setCurrentLat(lat);
        setCurrentLng(lng);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1 });
        }
      },
      (err) => {
        setIsGpsLoading(false);
        setGpsError('Gagal mendeteksi GPS perangkat. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleApplyPreset = (preset) => {
    setCurrentLat(preset.lat);
    setCurrentLng(preset.lng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 14, { duration: 1 });
    }
  };

  const handleConfirm = () => {
    onConfirm({
      lat: currentLat,
      lng: currentLng,
      radius_km: radiusKm
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              mode === 'zone' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {mode === 'zone' ? <Radio className="w-5 h-5 animate-pulse" /> : <Home className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {title || (mode === 'zone' ? 'Tentukan Titik Pusat Zona Bencana' : 'Tandai Lokasi Posko di Peta')}
              </h3>
              <p className="text-xs text-slate-500">
                Klik peta atau seret penanda untuk mengatur koordinat secara presisi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: GPS Button & Presets */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGetDeviceLocation}
              disabled={isGpsLoading}
              className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Crosshair className={`w-4 h-4 text-blue-600 ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span>{isGpsLoading ? 'Membaca GPS…' : 'Gunakan GPS Saya Saat Ini'}</span>
            </button>

            <span className="text-[11px] text-slate-400 hidden sm:inline">atau lompat ke:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {QUICK_PRESETS.slice(0, 3).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {mode === 'zone' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">Radius:</span>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-24 accent-rose-600 cursor-pointer"
              />
              <span className="font-extrabold text-rose-700 px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-md">
                {radiusKm} km
              </span>
            </div>
          )}
        </div>

        {gpsError && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Leaflet Map Canvas */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[400px] w-full bg-slate-100">
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
          
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-xs font-semibold text-slate-700 pointer-events-none flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Klik di mana saja untuk memindahkan titik</span>
          </div>
        </div>

        {/* Footer Coordinate Summary & Action */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-slate-500">Koordinat Terpilih:</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Lat: {currentLat}
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Lng: {currentLng}
              </span>
              {mode === 'zone' && (
                <span className="text-xs text-rose-800 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  Radius {radiusKm} km (~{(Math.PI * radiusKm * radiusKm).toFixed(1)} km²)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Gunakan Koordinat Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
