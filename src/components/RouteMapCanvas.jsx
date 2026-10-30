'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ArrowUpDown, Navigation, RefreshCw } from 'lucide-react';

export default function RouteMapCanvas({
  userLat,
  userLng,
  accuracyText = '± 108 m',
  target,
  smartRoutes = [],
  activeRouteId = 'route-0',
  onSelectRoute,
  hazards = [],
  allRoutesBlocked = false,
  currentStepIndex = 0,
  isNavigating = false,
  onStepClick,
  onStartNavigation
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const leafletModuleRef = useRef(null);
  const activePolylineRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState('motor');
  const [isReverse, setIsReverse] = useState(false);

  const activeRoute = (smartRoutes || []).find(r => r.id === activeRouteId) || smartRoutes[0] || null;
  const altRoute = (smartRoutes || []).find(r => r.id !== activeRouteId) || null;

  const targetLabelText = (target?.name || 'Tujuan Evakuasi').split(' (')[0];
  const isMainBlocked = Boolean(activeRoute?.isBlocked);

  // Dynamic travel times proportional to actual road distance & real-world traffic conditions
  // Calibrated to Google Maps benchmarks: 21.6 km Cilegon-Serang is ~38 min (motor) / ~40 min (mobil) / ~4.5h (jalan); 6.0 km is ~12 min (motor) / ~13 min (mobil) / 1j 14m (jalan)
  const transportTimes = useMemo(() => {
    const dist = activeRoute?.distanceMeters || target?.distanceMeters || 0;
    const dur = activeRoute?.durationSeconds || 0;
    if (!dist) return { motor: '—', mobil: '—', bus: '—', jalan: '—' };

    // Speeds in meters per second (calibrated to Indonesian city and arterial traffic):
    // Motor: ~34 km/h (9.4 m/s) -> 21.6 km takes ~38 mnt (matches Google Maps screenshot image5.png!)
    // Mobil: ~31 km/h (8.6 m/s) -> 21.6 km takes ~41 mnt
    // Bus: ~25 km/h (7.0 m/s) -> 21.6 km takes ~51 mnt
    // Jalan kaki: ~4.8 km/h (1.33 m/s) -> 6.0 km takes ~75 mnt / 1j 15m (matches Google Maps tampilan rute.jpeg 1j 14m!)
    const carSec = dur || Math.max(60, Math.round(dist / 8.6));
    const motorSec = Math.max(60, Math.round(carSec * 0.92));
    const busSec = Math.max(60, Math.round(carSec * 1.25));
    const walkSec = Math.max(60, Math.round(dist / 1.33));

    const fmt = (sec) => {
      const min = Math.max(1, Math.round(sec / 60));
      if (min < 60) return `${min} mnt`;
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h}j ${m}m` : `${h} jam`;
    };

    return {
      motor: fmt(motorSec),
      mobil: fmt(carSec),
      bus: fmt(busSec),
      jalan: fmt(walkSec)
    };
  }, [activeRoute, target]);

  const displayDistance = activeRoute?.distanceFormatted || target?.distance || '—';
  const displayDuration = transportTimes[selectedTransport] || activeRoute?.durationFormatted || target?.estTime || '—';

  // 1. Init Leaflet map once safely on client
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !containerRef.current) return;

      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }
      if (containerRef.current?._leaflet_id) {
        delete containerRef.current._leaflet_id;
      }

      try {
        const L = (await import('leaflet')).default;
        if (!isMounted || !containerRef.current) return;

        leafletModuleRef.current = L;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const startLat = Number.isFinite(userLat) ? userLat : -5.9860;
        const startLng = Number.isFinite(userLng) ? userLng : 106.0520;

        const map = L.map(containerRef.current, {
          center: [startLat, startLng],
          zoom: 13,
          zoomControl: false,
          attributionControl: true
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://openrouteservice.org" target="_blank">ORS</a>'
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;

        setMapReady(true);
        setMapError(null);

        setTimeout(() => { map.invalidateSize(); }, 200);
      } catch (err) {
        console.error('RouteMapCanvas init error:', err);
        if (isMounted) setMapError('Gagal memuat modul peta.');
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }
      if (containerRef.current?._leaflet_id) {
        delete containerRef.current._leaflet_id;
      }
      layerGroupRef.current = null;
      setMapReady(false);
    };
  }, []);

  // 2. Render rute nyata, hazard, dan pin setiap kali data berubah
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !layerGroupRef.current) return;
    const L = leafletModuleRef.current;
    if (!L) return;

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const startLat = Number.isFinite(userLat) ? userLat : -5.9860;
    const startLng = Number.isFinite(userLng) ? userLng : 106.0520;
    const endLat = Number.isFinite(target?.lat) ? target.lat : startLat + 0.01;
    const endLng = Number.isFinite(target?.lng) ? target.lng : startLng + 0.01;

    if (typeof window !== 'undefined') {
      window.__selectRoute = (routeId) => { if (onSelectRoute) onSelectRoute(routeId); };
    }

    // A. Hazard circles & markers
    (hazards || []).forEach(hazard => {
      const isActive = hazard.active || hazard.is_blocked_by_community;
      if (!isActive || !Number.isFinite(hazard.lat) || !Number.isFinite(hazard.lng)) return;

      const isClosed = hazard.severity === 'closed' || hazard.is_blocked_by_community;
      const circleColor = isClosed ? '#DC2626' : '#D97706';
      const fillColor = isClosed ? '#EF4444' : '#F59E0B';

      const hazardCircle = L.circle([hazard.lat, hazard.lng], {
        radius: hazard.radius_meters || 150,
        color: circleColor,
        fillColor,
        fillOpacity: isClosed ? 0.32 : 0.18,
        weight: 2.5,
        dashArray: '5, 5'
      });

      const reportLabel = hazard.is_blocked_by_community
        ? `<p class="text-[11px] text-rose-700 font-bold mt-1">⛔ Diblokir ${hazard.report_count || 5} laporan warga</p>`
        : '';

      hazardCircle.bindPopup(`
        <div class="text-xs space-y-1 max-w-[220px]">
          <span class="px-2 py-0.5 rounded text-white font-extrabold text-[10px] ${isClosed ? 'bg-rose-600' : 'bg-amber-600'}">
            ${isClosed ? '⛔ DITUTUP' : '⚠️ WASPADA'}
          </span>
          <p class="font-extrabold text-slate-900 mt-1">${hazard.road_name}</p>
          <p class="text-slate-600 text-[11px]">${hazard.description}</p>
          ${hazard.water_depth ? `<p class="text-[11px] text-rose-700 font-bold">Ketinggian Air: ${hazard.water_depth}</p>` : ''}
          ${reportLabel}
          <div class="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
            ${hazard.reported_by || 'BPBD'} · ${hazard.reported_at || ''}
          </div>
        </div>
      `);
      layerGroup.addLayer(hazardCircle);

      const hazardIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="transform:translate(-50%,-50%)" class="flex flex-col items-center">
            ${isClosed ? '<span class="absolute w-10 h-10 rounded-full bg-rose-500/50 animate-ping"></span>' : ''}
            <div class="w-8 h-8 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-xl border-2 border-white ${isClosed ? 'bg-rose-600' : 'bg-amber-500'} text-white">
              ${isClosed ? '⛔' : '⚠️'}
            </div>
            <span class="mt-0.5 px-2 py-0.5 rounded-md bg-slate-950/95 text-white text-[8px] font-extrabold whitespace-nowrap shadow-md border border-slate-700">
              ${isClosed ? (hazard.water_depth ? `Banjir ${hazard.water_depth}` : 'Tutup') : 'Waspada'}
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const hazardMarker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon, zIndexOffset: 890 });
      hazardMarker.bindPopup(hazardCircle.getPopup());
      layerGroup.addLayer(hazardMarker);
    });

    // B. Rute alternatif (digambar duluan, di belakang)
    const routesToRender = Array.isArray(smartRoutes) && smartRoutes.length > 0 ? smartRoutes : [];

    routesToRender.forEach(r => {
      if (r.id === activeRouteId) return;
      if (!Array.isArray(r.coordinates) || r.coordinates.length < 2) return;

      const altPolyline = L.polyline(r.coordinates, {
        color: r.isBlocked ? '#EF4444' : '#94A3B8',
        weight: 5,
        opacity: 0.75,
        dashArray: '8, 6',
        lineCap: 'round',
        lineJoin: 'round'
      });

      altPolyline.bindPopup(`
        <div class="text-xs space-y-1">
          <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-extrabold text-[10px]">${r.name}</span>
          <p class="font-extrabold text-slate-900 mt-1">${r.summary || ''}</p>
          <p class="text-slate-600 text-[11px]">${r.distanceFormatted} · ${r.durationFormatted}</p>
          <button onclick="window.__selectRoute('${r.id}')" class="w-full mt-1.5 py-1 px-2 rounded-lg bg-blue-600 text-white font-bold text-[10px] cursor-pointer">
            Pakai Rute Ini
          </button>
        </div>
      `);
      if (onSelectRoute) altPolyline.on('click', () => onSelectRoute(r.id));
      layerGroup.addLayer(altPolyline);
    });

    // C. Rute aktif (di atas, glow + main line jalan nyata)
    const currentActiveRoute = routesToRender.find(r => r.id === activeRouteId) || routesToRender[0];

    if (currentActiveRoute && Array.isArray(currentActiveRoute.coordinates) && currentActiveRoute.coordinates.length >= 2) {
      const isBlocked = currentActiveRoute.isBlocked;
      const isImpacted = currentActiveRoute.isImpacted;

      const mainColor = isBlocked ? '#DC2626' : isImpacted ? '#D97706' : '#2563EB';
      const glowColor = isBlocked ? '#FCA5A5' : isImpacted ? '#FDE68A' : '#93C5FD';

      // Glow line
      layerGroup.addLayer(L.polyline(currentActiveRoute.coordinates, {
        color: glowColor, weight: 12, opacity: 0.55,
        lineCap: 'round', lineJoin: 'round'
      }));

      // Main polyline
      const mainLine = L.polyline(currentActiveRoute.coordinates, {
        color: mainColor, weight: 6, opacity: 0.98,
        dashArray: isBlocked ? '8, 8' : undefined,
        lineCap: 'round', lineJoin: 'round'
      });
      layerGroup.addLayer(mainLine);
      activePolylineRef.current = mainLine;

      // Waypoint step markers dari jalan nyata
      if (Array.isArray(currentActiveRoute.steps) && currentActiveRoute.steps.length > 0) {
        currentActiveRoute.steps.forEach((step, idx) => {
          if (!Number.isFinite(step.lat) || !Number.isFinite(step.lng)) return;
          const isCurrentStep = idx === currentStepIndex;

          const stepIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div style="transform:translate(-50%,-50%)" class="flex flex-col items-center cursor-pointer">
                ${isCurrentStep ? '<span class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping"></span>' : ''}
                <div class="w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[9px] text-white shadow-md border-2 border-white ${isCurrentStep ? 'bg-blue-600 scale-125' : 'bg-slate-700'}">
                  ${step.step || idx + 1}
                </div>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          const stepMarker = L.marker([step.lat, step.lng], { icon: stepIcon, zIndexOffset: isCurrentStep ? 930 : 780 });
          stepMarker.bindPopup(`
            <div class="text-xs space-y-1 max-w-[200px]">
              <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-extrabold text-[10px]">LANGKAH ${step.step || idx + 1}</span>
              <p class="font-extrabold text-slate-900 mt-1">${step.title}</p>
              <p class="text-slate-600 text-[11px]">${step.instruction}</p>
            </div>
          `);
          if (onStepClick) stepMarker.on('click', () => onStepClick(idx));
          layerGroup.addLayer(stepMarker);
        });
      }

      // Auto fit bounds yang mencakup seluruh rute + kedua titik (awal & akhir)
      try {
        const bounds = mainLine.getBounds();
        bounds.extend([startLat, startLng]);
        bounds.extend([endLat, endLng]);
        if (bounds?.isValid?.()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
        }
      } catch {
        map.setView([startLat, startLng], 13);
      }
    } else {
      // Belum ada rute — pusatkan antara start dan target
      try {
        const bounds = L.latLngBounds([[startLat, startLng], [endLat, endLng]]);
        if (bounds?.isValid?.()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      } catch {}
    }

    // D. Pin Lokasi Anda (GPS)
    const accuracyNum = parseInt(accuracyText.replace(/\D/g, ''), 10) || 50;
    layerGroup.addLayer(L.circle([startLat, startLng], {
      radius: Math.min(accuracyNum, 80),
      color: '#3B82F6', fillColor: '#3B82F6',
      fillOpacity: 0.12, weight: 1.5, dashArray: '3, 3'
    }));

    const userIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="transform:translate(-50%,-50%)" class="flex flex-col items-center">
          <span class="absolute w-8 h-8 rounded-full bg-blue-500/35 animate-ping"></span>
          <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl ring-4 ring-blue-400/40 flex items-center justify-center text-white">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
          </div>
          <span class="mt-1 px-2 py-0.5 rounded-md bg-slate-900/95 text-white text-[9px] font-extrabold whitespace-nowrap shadow-md border border-slate-700">
            Lokasi Anda
          </span>
        </div>
      `,
      iconSize: [30, 30], iconAnchor: [15, 15]
    });

    const userMarker = L.marker([startLat, startLng], { icon: userIcon, zIndexOffset: 860 });
    userMarker.bindPopup(`
      <div class="text-xs space-y-1">
        <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">TITIK AWAL (GPS)</span>
        <p class="font-extrabold text-slate-900 mt-1">Lokasi Perangkat Anda</p>
        <p class="text-slate-600 text-[11px]">Akurasi: <strong>${accuracyText}</strong></p>
        <p class="text-slate-500 text-[10px] font-mono">${startLat.toFixed(5)}, ${startLng.toFixed(5)}</p>
      </div>
    `);
    layerGroup.addLayer(userMarker);

    // E. Pin Tujuan (Merah / Hijau)
    const targetBadgeColor = target?.category === 'darurat' ? '#DC2626' : '#059669';
    const targetIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="transform:translate(-50%,-100%)" class="flex flex-col items-center">
          <span class="absolute -top-1 w-10 h-10 rounded-2xl animate-ping" style="background:${targetBadgeColor}55"></span>
          <div class="w-9 h-9 rounded-2xl text-white shadow-xl flex items-center justify-center border-2 border-white" style="background:${targetBadgeColor}">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <span class="mt-1 whitespace-nowrap px-2.5 py-0.5 rounded-lg bg-slate-950/95 text-white text-[9px] font-extrabold shadow-md border border-slate-700 max-w-[140px] truncate">
            ${targetLabelText}
          </span>
        </div>
      `,
      iconSize: [36, 52], iconAnchor: [18, 52]
    });

    const targetMarker = L.marker([endLat, endLng], { icon: targetIcon, zIndexOffset: 960 });
    targetMarker.bindPopup(`
      <div class="text-xs space-y-1.5 max-w-[240px]">
        <span class="px-2 py-0.5 rounded text-white font-extrabold text-[10px]" style="background:${targetBadgeColor}">🎯 TITIK TUJUAN</span>
        <p class="font-extrabold text-slate-900 text-sm mt-1 leading-tight">${target?.name || 'Tujuan'}</p>
        <p class="text-slate-600 text-[11px]">${target?.address || ''}</p>
        <div class="pt-1.5 flex items-center justify-between text-[11px] font-bold border-t border-slate-200">
          <span class="text-blue-700">${displayDistance}</span>
          <span class="text-emerald-700">${displayDuration}</span>
        </div>
      </div>
    `);
    layerGroup.addLayer(targetMarker);

  }, [mapReady, userLat, userLng, target, smartRoutes, activeRouteId, hazards, accuracyText, currentStepIndex, displayDistance, displayDuration, targetLabelText, onSelectRoute, onStepClick]);

  // Controls
  const handleZoomIn = useCallback(() => { mapInstanceRef.current?.zoomIn(); }, []);
  const handleZoomOut = useCallback(() => { mapInstanceRef.current?.zoomOut(); }, []);
  const handleCenterUser = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [Number.isFinite(userLat) ? userLat : -5.9860, Number.isFinite(userLng) ? userLng : 106.0520],
        16, { animate: true }
      );
    }
  }, [userLat, userLng]);

  const handleFitRoute = useCallback(() => {
    if (mapInstanceRef.current && activePolylineRef.current) {
      try {
        const bounds = activePolylineRef.current.getBounds();
        const startLat = Number.isFinite(userLat) ? userLat : -5.9860;
        const startLng = Number.isFinite(userLng) ? userLng : 106.0520;
        const endLat = Number.isFinite(target?.lat) ? target.lat : startLat + 0.01;
        const endLng = Number.isFinite(target?.lng) ? target.lng : startLng + 0.01;
        bounds.extend([startLat, startLng]);
        bounds.extend([endLat, endLng]);
        if (bounds?.isValid?.()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
        }
      } catch {}
    }
  }, [userLat, userLng, target]);

  return (
    <div className="relative rounded-3xl overflow-hidden border-2 border-slate-300 bg-[#E8ECEF] shadow-2xl text-slate-900 animate-fadeIn select-none">

      {/* Top card: Origin → Destination */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-300 p-3 shadow-lg flex items-center justify-between gap-3 text-slate-900">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex flex-col items-center justify-center shrink-0 py-0.5">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-sm ring-2 ring-blue-300" />
              <span className="w-0.5 h-4 bg-slate-300 my-0.5" />
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-sm ring-2 ring-rose-300" />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 truncate">
                  {isReverse ? targetLabelText : 'Lokasi Anda (GPS Aktif)'}
                </span>
                <span className="text-[10px] text-blue-600 font-bold shrink-0">{accuracyText}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 truncate">
                  {isReverse ? 'Lokasi Anda (GPS Aktif)' : targetLabelText}
                </span>
                <span className="text-[10px] text-emerald-700 font-extrabold shrink-0">{displayDistance}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setIsReverse(!isReverse)}
              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Tukar arah"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="w-full relative overflow-hidden bg-slate-900" style={{ height: '390px', minHeight: '370px' }}>
        <div ref={containerRef} className="w-full h-full z-0" />

        {/* Map controls */}
        <div className="absolute top-20 right-3 z-20 flex flex-col gap-1.5">
          <button type="button" onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center font-bold text-sm shadow-md cursor-pointer"
            title="Perbesar">+</button>
          <button type="button" onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center font-bold text-sm shadow-md cursor-pointer"
            title="Perkecil">-</button>
          <button type="button" onClick={handleFitRoute}
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs shadow-md cursor-pointer"
            title="Pusatkan Seluruh Rute Jalan">🗺️</button>
          <button type="button" onClick={handleCenterUser}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center text-xs shadow-md cursor-pointer"
            title="Ke lokasi GPS">🎯</button>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between text-[10px] pointer-events-none">
          <div className="px-2.5 py-1 bg-slate-950/90 backdrop-blur-md rounded-lg border border-slate-700 text-slate-200 font-semibold flex items-center gap-2 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OpenStreetMap · OpenRouteService Engine · GPS ({accuracyText})</span>
          </div>
        </div>
      </div>

      {/* Bottom sheet — Mirip Google Maps & Gojek */}
      <div className="bg-white border-t border-slate-300 p-4 space-y-3 shadow-2xl">

        {/* Mode transportasi interaktif (Motor, Mobil, Armada, Jalan) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'motor', icon: '🏍️', label: 'Motor', time: transportTimes.motor },
              { id: 'mobil', icon: '🚗', label: 'Mobil', time: transportTimes.mobil },
              { id: 'bus', icon: '🚌', label: 'Armada', time: transportTimes.bus },
              { id: 'jalan', icon: '🚶', label: 'Jalan', time: transportTimes.jalan }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTransport(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                  selectedTransport === item.id
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="text-[11px] font-bold">{item.time}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {altRoute && (
              <button
                type="button"
                onClick={() => onSelectRoute && altRoute && onSelectRoute(altRoute.id)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                title="Rute alternatif"
              >
                <span>🔀</span>
                <span className="hidden sm:inline">Rute Opsi</span>
              </button>
            )}
          </div>
        </div>

        {/* Pilih rute chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(smartRoutes || []).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRoute && onSelectRoute(r.id)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeRouteId === r.id && !r.isBlocked
                  ? 'bg-slate-900 text-white border-slate-900'
                  : r.isBlocked
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {r.isBlocked ? '⛔' : '✓'} {r.name}
            </button>
          ))}

          <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold whitespace-nowrap shrink-0">
            {activeRoute?.statusLabel || 'Jalur Jalan Terverifikasi'}
          </span>
        </div>

        {/* Waktu & jarak dinamis sesuai moda transportasi terpilih */}
        <div className="space-y-1">
          {isMainBlocked ? (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 text-xs font-bold flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">⛔</span>
              <div>
                <p className="font-extrabold text-rose-900 text-sm">
                  Penutupan Jalan: {activeRoute?.blockedBy?.[0]?.road_name || 'Ruas Jalan Ini'}
                </p>
                <p className="text-[11px] font-semibold text-rose-800 mt-0.5">
                  {activeRoute?.blockedBy?.[0]?.hazard_type || 'Bahaya Bencana'}. Jalur dialihkan ke rute alternatif yang layak.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-800 tracking-tight">
                  {displayDuration}
                </span>
                <span className="text-sm font-bold text-slate-700">
                  ({displayDistance})
                </span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  via {selectedTransport === 'motor' ? 'Motor' : selectedTransport === 'mobil' ? 'Mobil' : selectedTransport === 'bus' ? 'Armada' : 'Jalan Kaki'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                🍃 {activeRoute?.selectionReason || 'Rute terverifikasi via OpenRouteService dengan jalur jalan nyata.'}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onStartNavigation}
            disabled={allRoutesBlocked}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 ${
              allRoutesBlocked
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>{isNavigating ? 'Reset Navigasi' : 'Mulai Navigasi'}</span>
          </button>

          {altRoute && (
            <button
              type="button"
              onClick={() => onSelectRoute && onSelectRoute(altRoute.id)}
              className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>🔀 Ganti Rute</span>
            </button>
          )}

          <a
            href="tel:115"
            className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 font-extrabold text-xs flex items-center justify-center shadow-sm"
            title="Hubungi SAR 115"
          >
            <span className="font-bold">SAR 115</span>
          </a>
        </div>
      </div>
    </div>
  );
}
