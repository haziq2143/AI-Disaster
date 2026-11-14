'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Crosshair, 
  MapPin, 
  Radio, 
  Home, 
  AlertTriangle, 
  Layers, 
  ShieldAlert,
  Users
} from 'lucide-react';

export default function UnifiedSarOperationsMap({
  currentMode = 'zone', // 'zone' | 'posko'
  activeLat,
  activeLng,
  onLocationChange,
  radiusKm = 2.5,
  severityLevel = 'level_3_critical',
  reports = [],
  poskos = [],
  zones = [],
  isGpsLoading = false,
  onRefreshGps,
  hasRealGps = false
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const activeMarkerRef = useRef(null);
  const activeCircleRef = useRef(null);
  const dynamicLayersRef = useRef(null);

  const numLat = Number(activeLat) && !isNaN(Number(activeLat)) ? Number(activeLat) : -6.9175;
  const numLng = Number(activeLng) && !isNaN(Number(activeLng)) ? Number(activeLng) : 107.6191;
  const numRadius = Number(radiusKm) && !isNaN(Number(radiusKm)) ? Number(radiusKm) : 2.5;

  const [showVictimsLayer, setShowVictimsLayer] = useState(true);
  const [showPoskosLayer, setShowPoskosLayer] = useState(true);
  const [showZonesLayer, setShowZonesLayer] = useState(true);

  // 1. Initialize Map once
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !containerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center: [numLat, numLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });
      mapInstanceRef.current = map;

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Layer group for reports, poskos, zones
      const layerGroup = L.layerGroup().addTo(map);
      dynamicLayersRef.current = layerGroup;

      // Active Target Circle (for Zone)
      const circleColor = severityLevel === 'level_3_critical' ? '#e11d48' : severityLevel === 'level_2_warning' ? '#d97706' : '#2563eb';
      const circle = L.circle([numLat, numLng], {
        radius: numRadius * 1000,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: currentMode === 'zone' ? 0.25 : 0,
        weight: currentMode === 'zone' ? 2 : 0
      }).addTo(map);
      activeCircleRef.current = circle;

      // Active Target Pin (draggable)
      const marker = L.marker([numLat, numLng], {
        draggable: true,
        title: currentMode === 'zone' ? 'Titik Pusat Zona Bencana' : 'Titik Posko Evakuasi'
      }).addTo(map);
      activeMarkerRef.current = marker;

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const fixedLat = Number(pos.lat.toFixed(6));
        const fixedLng = Number(pos.lng.toFixed(6));
        onLocationChange?.({ lat: fixedLat, lng: fixedLng });
      });

      // Map Click Handler
      map.on('click', (e) => {
        const fixedLat = Number(e.latlng.lat.toFixed(6));
        const fixedLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([fixedLat, fixedLng]);
        if (activeCircleRef.current) {
          activeCircleRef.current.setLatLng([fixedLat, fixedLng]);
        }
        onLocationChange?.({ lat: fixedLat, lng: fixedLng });
      });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        activeMarkerRef.current = null;
        activeCircleRef.current = null;
        dynamicLayersRef.current = null;
      }
    };
  }, []);

  // 2. Fly map to coords when activeLat/Lng changes significantly or on GPS update
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (activeMarkerRef.current) {
      activeMarkerRef.current.setLatLng([numLat, numLng]);
    }
    if (activeCircleRef.current) {
      activeCircleRef.current.setLatLng([numLat, numLng]);
    }
  }, [numLat, numLng]);

  // 3. Update active circle appearance based on mode & radius
  useEffect(() => {
    if (!activeCircleRef.current) return;
    if (currentMode === 'zone') {
      activeCircleRef.current.setRadius(numRadius * 1000);
      const circleColor = severityLevel === 'level_3_critical' ? '#e11d48' : severityLevel === 'level_2_warning' ? '#d97706' : '#2563eb';
      activeCircleRef.current.setStyle({
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.25,
        weight: 2
      });
    } else {
      activeCircleRef.current.setStyle({
        fillOpacity: 0,
        weight: 0
      });
    }
  }, [currentMode, numRadius, severityLevel]);

  // 4. Update dynamic background layers (Reports, Poskos, Zones)
  useEffect(() => {
    async function renderLayers() {
      if (!dynamicLayersRef.current || !mapInstanceRef.current) return;
      const L = (await import('leaflet')).default;
      dynamicLayersRef.current.clearLayers();

      // A. Existing Zones
      if (showZonesLayer && Array.isArray(zones)) {
        zones.forEach(z => {
          if (typeof z.lat === 'number' && typeof z.lng === 'number') {
            const zColor = z.severity_level === 'level_3_critical' ? '#e11d48' : z.severity_level === 'level_2_warning' ? '#d97706' : '#2563eb';
            const c = L.circle([z.lat, z.lng], {
              radius: (Number(z.radius_km) || 2) * 1000,
              color: zColor,
              fillColor: zColor,
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '5, 5'
            });
            c.bindTooltip(`<b>${z.name}</b> (${z.severity_label || z.severity_level})<br/>Radius: ${z.radius_km} km`, { permanent: false });
            c.addTo(dynamicLayersRef.current);
          }
        });
      }

      // B. Existing Poskos
      if (showPoskosLayer && Array.isArray(poskos)) {
        poskos.forEach(p => {
          if (typeof p.lat === 'number' && typeof p.lng === 'number') {
            const isClosed = p.operational_status === 'closed';
            const iconHtml = `
              <div style="background:${isClosed ? '#64748b' : '#0D47A1'};color:#fff;border:2px solid #fff;border-radius:10px;padding:3px 7px;font-size:10px;font-weight:bold;white-space:nowrap;box-shadow:0 3px 6px rgba(0,0,0,0.25);display:flex;align-items:center;gap:4px;">
                <span style="font-size:9px;font-weight:900;background:rgba(255,255,255,0.2);padding:1px 3px;border-radius:4px;">POS</span>
                <span>${p.name.slice(0, 16)}</span>
              </div>
            `;
            const divIcon = L.divIcon({
              className: 'sar-map-posko-badge',
              html: iconHtml,
              iconSize: [100, 24],
              iconAnchor: [50, 12]
            });
            const m = L.marker([p.lat, p.lng], { icon: divIcon });
            m.bindTooltip(`<b>${p.name}</b><br/>${p.address}<br/>Kapasitas: ${p.current_occupancy || 0}/${p.max_capacity || 100} Jiwa`, { permanent: false });
            m.addTo(dynamicLayersRef.current);
          }
        });
      }

      // C. Active SOS Reports
      if (showVictimsLayer && Array.isArray(reports)) {
        reports.forEach(r => {
          if (typeof r.lat === 'number' && typeof r.lng === 'number' && r.status !== 'resolved') {
            const isOtw = r.status === 'in_progress';
            const isPass = r.verification_type === 'trap_inactivity_pass' || r.urgency_level === 'kritis';
            const badgeColor = isOtw ? '#2563eb' : isPass ? '#e11d48' : '#d97706';
            const iconHtml = `
              <div style="background:${badgeColor};color:#fff;border:2px solid #fff;border-radius:999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;box-shadow:0 2px 5px rgba(0,0,0,0.3);animation:${isPass && !isOtw ? 'pulse 1.5s infinite' : 'none'};">
                ${isOtw ? 'OTW' : 'SOS'}
              </div>
            `;
            const divIcon = L.divIcon({
              className: 'sar-victim-badge',
              html: iconHtml,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            const vm = L.marker([r.lat, r.lng], { icon: divIcon });
            vm.bindTooltip(`<b>${r.reporter_name || 'Korban'}</b><br/>${r.hazard_type.toUpperCase()} · ${r.urgency_level}<br/>Status: ${isOtw ? 'Tim SAR OTW' : 'Menunggu Evakuasi'}`, { permanent: false });
            vm.addTo(dynamicLayersRef.current);
          }
        });
      }
    }

    renderLayers();
  }, [reports, poskos, zones, showVictimsLayer, showPoskosLayer, showZonesLayer]);

  const handleCenterToLocation = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([numLat, numLng], 15, { duration: 0.8 });
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-700" />
            Peta Operasi SAR Real-Time
          </span>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            hasRealGps 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {hasRealGps ? 'GPS Tim SAR Terkunci' : 'Koordinat Default'}
          </span>
        </div>

        {/* Layer Toggles & GPS Refresh */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onRefreshGps}
            disabled={isGpsLoading}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Sinkronkan pin ke GPS fisik perangkat SAR saat ini"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span>{isGpsLoading ? 'Membaca GPS…' : 'Ambil GPS Saya'}</span>
          </button>

          <button
            type="button"
            onClick={handleCenterToLocation}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            title="Pusatkan peta ke pin penanda aktif"
          >
            Pusatkan Pin
          </button>

          {/* Mini Layer Filters */}
          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setShowVictimsLayer(!showVictimsLayer)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                showVictimsLayer ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Laporan ({reports.filter(r => r.status !== 'resolved').length})
            </button>
            <button
              type="button"
              onClick={() => setShowPoskosLayer(!showPoskosLayer)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                showPoskosLayer ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Home className="w-3 h-3 text-blue-600" />
              Posko ({poskos.length})
            </button>
            <button
              type="button"
              onClick={() => setShowZonesLayer(!showZonesLayer)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                showZonesLayer ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              Zona ({zones.length})
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Leaflet Map */}
      <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-100">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {/* Top Left Floating Notice */}
        <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-semibold text-slate-700 pointer-events-none flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${currentMode === 'zone' ? 'bg-rose-600' : 'bg-blue-600'}`} />
          <span>
            {currentMode === 'zone' 
              ? 'Klik/geser pin untuk menentukan titik pusat zona bahaya' 
              : 'Klik/geser pin untuk menandai lokasi pendirian posko baru'}
          </span>
        </div>

        {/* Bottom Coordinates & Radius Pill */}
        <div className="absolute bottom-3 left-3 right-14 z-[400] bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center justify-between gap-2 text-xs flex-wrap pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Pin Aktif:</span>
            <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {numLat.toFixed(5)}, {numLng.toFixed(5)}
            </span>
          </div>

          {currentMode === 'zone' && (
            <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md text-[11px]">
              Radius Bahaya: {numRadius} km (~{(Math.PI * numRadius * numRadius).toFixed(1)} km²)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
