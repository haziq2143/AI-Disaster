'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUpDown, Navigation } from 'lucide-react';

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

  // Active chosen route object
  const activeRoute = (smartRoutes || []).find(r => r.id === activeRouteId) || smartRoutes[0] || null;
  const altRoute = (smartRoutes || []).find(r => r.id !== activeRouteId) || null;

  const displayDistance = activeRoute?.distanceFormatted || target?.distance || '21,6 km';
  const displayDuration = activeRoute?.durationFormatted || target?.estTime || '38 mnt';
  const targetLabelText = (target?.name || 'Tujuan Evakuasi').split(' (')[0];
  const isMainBlocked = Boolean(activeRoute?.isBlocked);

  // 1. Initialize Leaflet Map safely on client
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !containerRef.current) return;

      // Clean previous map instance if exists
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }

      if (containerRef.current && containerRef.current._leaflet_id) {
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
        const startLng = Number.isFinite(userLng) ? userLng : 106.0344;

        const map = L.map(containerRef.current, {
          center: [startLat, startLng],
          zoom: 13,
          zoomControl: false,
          attributionControl: true
        });

        // OpenStreetMap Standard Tiles
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;

        setMapReady(true);
        setMapError(null);

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      } catch (err) {
        console.error('Error initializing RouteMapCanvas Leaflet:', err);
        if (isMounted) {
          setMapError('Gagal memuat modul peta Leaflet.');
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
      if (containerRef.current && containerRef.current._leaflet_id) {
        delete containerRef.current._leaflet_id;
      }
      layerGroupRef.current = null;
      setMapReady(false);
    };
  }, []);

  // 2. Render Smart Routes (Primary & Alternatives), Road Hazards, and Pins
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !layerGroupRef.current) return;
    const L = leafletModuleRef.current;
    if (!L) return;

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const startLat = Number.isFinite(userLat) ? userLat : -5.9860;
    const startLng = Number.isFinite(userLng) ? userLng : 106.0344;
    const endLat = Number.isFinite(target?.lat) ? target.lat : (startLat + 0.003);
    const endLng = Number.isFinite(target?.lng) ? target.lng : (startLng + 0.002);

    if (typeof window !== 'undefined') {
      window.__selectRoute = (routeId) => {
        if (onSelectRoute) onSelectRoute(routeId);
      };
    }

    // A. RENDER DISASTER ROAD HAZARDS & CLOSURES (Requirement 3 & 4)
    (hazards || []).forEach(hazard => {
      if (!hazard.active || !Number.isFinite(hazard.lat) || !Number.isFinite(hazard.lng)) return;

      const isClosed = hazard.severity === 'closed';
      const isVerified = hazard.status === 'verified';

      const circleColor = isClosed ? '#DC2626' : '#D97706';
      const fillColor = isClosed ? '#EF4444' : '#F59E0B';

      const hazardCircle = L.circle([hazard.lat, hazard.lng], {
        radius: hazard.radius_meters || 150,
        color: circleColor,
        fillColor: fillColor,
        fillOpacity: isClosed ? 0.32 : 0.18,
        weight: 2.5,
        dashArray: '5, 5'
      });

      hazardCircle.bindPopup(`
        <div class="text-xs space-y-1.5 max-w-[240px]">
          <div class="flex items-center gap-1">
            <span class="px-2 py-0.5 rounded text-white font-extrabold text-[10px] ${
              isClosed ? 'bg-rose-600' : 'bg-amber-600'
            }">
              ${isClosed ? '⛔ RUAS JALAN DITUTUP' : '⚠️ WASPADA TERDAMPAK'}
            </span>
            <span class="text-[9px] font-bold text-slate-500">
              ${isVerified ? '• Terverifikasi BPBD' : '• Laporan Warga'}
            </span>
          </div>
          <p class="font-extrabold text-slate-900 text-sm mt-0.5">${hazard.road_name}</p>
          <p class="text-slate-600 text-[11px] leading-relaxed">${hazard.description}</p>
          ${hazard.water_depth ? `<p class="text-[11px] text-rose-700 font-bold">Ketinggian Air: ${hazard.water_depth}</p>` : ''}
          <div class="pt-1 border-t border-slate-200 text-[10px] text-slate-500">
            Sumber: ${hazard.reported_by} (${hazard.reported_at})
          </div>
        </div>
      `);
      layerGroup.addLayer(hazardCircle);

      const hazardIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex flex-col items-center" style="transform: translate(-50%, -50%);">
            ${isClosed ? '<span class="absolute w-10 h-10 rounded-full bg-rose-500/50 animate-ping"></span>' : ''}
            <div class="w-8 h-8 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-xl border-2 border-white ${
              isClosed ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
            }">
              ${isClosed ? '⛔' : '⚠️'}
            </div>
            <span class="mt-0.5 px-2 py-0.5 rounded-md bg-slate-950/95 text-white text-[8px] font-extrabold whitespace-nowrap shadow-md border border-slate-700">
              ${isClosed ? (hazard.water_depth ? `Banjir ${hazard.water_depth}` : 'Tutup Total') : 'Waspada'}
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

    // B. RENDER SMART ROUTES (Primary & Alternatives)
    const routesToRender = Array.isArray(smartRoutes) && smartRoutes.length > 0 ? smartRoutes : [];

    // Draw inactive alternative routes first
    routesToRender.forEach(r => {
      const isSelected = r.id === activeRouteId;
      if (isSelected) return;
      if (!Array.isArray(r.coordinates) || r.coordinates.length < 2) return;

      const altColor = r.isBlocked ? '#EF4444' : '#64748B';

      const altPolyline = L.polyline(r.coordinates, {
        color: altColor,
        weight: 5.5,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      });

      altPolyline.bindPopup(`
        <div class="text-xs space-y-1">
          <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-extrabold text-[10px]">
            ${r.name}
          </span>
          <p class="font-extrabold text-slate-900 mt-1">${r.summary}</p>
          <p class="text-slate-600 text-[11px]">Jarak: ${r.distanceFormatted} • Estimasi: ${r.durationFormatted}</p>
          <p class="text-[10px] font-bold ${r.isBlocked ? 'text-rose-600' : 'text-slate-700'}">
            Status: ${r.statusLabel}
          </p>
          <button onclick="window.__selectRoute('${r.id}')" class="w-full mt-1.5 py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer shadow">
            Gunakan Rute Alternatif Ini
          </button>
        </div>
      `);

      if (onSelectRoute) {
        altPolyline.on('click', () => onSelectRoute(r.id));
      }

      layerGroup.addLayer(altPolyline);
    });

    // Draw ACTIVE ROUTE on top
    const currentActiveRoute = routesToRender.find(r => r.id === activeRouteId) || routesToRender[0];

    if (currentActiveRoute && Array.isArray(currentActiveRoute.coordinates) && currentActiveRoute.coordinates.length >= 2) {
      const isBlocked = currentActiveRoute.isBlocked;
      const isImpacted = currentActiveRoute.isImpacted;

      const mainColor = isBlocked ? '#DC2626' : isImpacted ? '#D97706' : '#2563EB';
      const glowColor = isBlocked ? '#FCA5A5' : isImpacted ? '#FDE68A' : '#93C5FD';

      // Outer glow line
      const glowLine = L.polyline(currentActiveRoute.coordinates, {
        color: glowColor,
        weight: 10,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round'
      });
      layerGroup.addLayer(glowLine);

      // Main polyline
      const mainLine = L.polyline(currentActiveRoute.coordinates, {
        color: mainColor,
        weight: 6,
        opacity: 0.98,
        dashArray: isBlocked ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      });
      layerGroup.addLayer(mainLine);
      activePolylineRef.current = mainLine;

      // Waypoint step pins
      if (Array.isArray(currentActiveRoute.steps) && currentActiveRoute.steps.length > 0) {
        currentActiveRoute.steps.forEach((step, idx) => {
          if (!Number.isFinite(step.lat) || !Number.isFinite(step.lng)) return;
          const isCurrentStep = idx === currentStepIndex;

          const stepIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div class="relative flex flex-col items-center cursor-pointer" style="transform: translate(-50%, -50%);">
                ${isCurrentStep ? '<span class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping"></span>' : ''}
                <div class="w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[9px] text-white shadow-md border-2 border-white transition-transform ${
                  isCurrentStep ? 'bg-blue-600 ring-4 ring-blue-400/60 scale-125' : 'bg-slate-700 hover:scale-110'
                }">
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
              <span class="px-2 py-0.5 rounded bg-blue-100 text-[#0D47A1] font-extrabold text-[10px]">
                LANGKAH ${step.step || idx + 1}
              </span>
              <p class="font-extrabold text-slate-900 mt-1">${step.title}</p>
              <p class="text-slate-600 text-[11px] leading-tight">${step.instruction}</p>
            </div>
          `);
          if (onStepClick) {
            stepMarker.on('click', () => onStepClick(idx));
          }
          layerGroup.addLayer(stepMarker);
        });
      }

      // Auto fit bounds
      try {
        const bounds = mainLine.getBounds();
        if (bounds && bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 16,
            animate: true
          });
        }
      } catch (err) {
        map.setView([startLat, startLng], 14);
      }
    }

    // C. START PIN: "Lokasi Anda (GPS)"
    const accuracyNum = parseInt(accuracyText.replace(/\D/g, ''), 10) || 50;
    const userAccCircle = L.circle([startLat, startLng], {
      radius: Math.min(accuracyNum, 80),
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '3, 3'
    });
    layerGroup.addLayer(userAccCircle);

    const userIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex flex-col items-center" style="transform: translate(-50%, -50%);">
          <span class="absolute w-8 h-8 rounded-full bg-blue-500/35 animate-ping"></span>
          <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl ring-4 ring-blue-400/40 flex items-center justify-center text-white">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
          </div>
          <span class="mt-1 px-2 py-0.5 rounded-md bg-slate-900/95 text-white text-[9px] font-extrabold whitespace-nowrap shadow-md border border-slate-700">
            Lokasi Anda
          </span>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const userMarker = L.marker([startLat, startLng], { icon: userIcon, zIndexOffset: 860 });
    userMarker.bindPopup(`
      <div class="text-xs space-y-1">
        <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">TITIK AWAL (GPS)</span>
        <p class="font-extrabold text-slate-900 mt-1">Lokasi Perangkat Anda</p>
        <p class="text-slate-600 text-[11px]">Akurasi Sensor: <strong>${accuracyText}</strong></p>
        <p class="text-slate-500 text-[10px] font-mono">${startLat.toFixed(5)}, ${startLng.toFixed(5)}</p>
      </div>
    `);
    layerGroup.addLayer(userMarker);

    // D. DESTINATION PIN (Red Teardrop Pin)
    const targetBadgeColor = target?.category === 'darurat' ? 'bg-rose-600' : 'bg-emerald-600';
    const targetIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
          <span class="absolute -top-1 w-10 h-10 rounded-2xl ${targetBadgeColor}/35 animate-ping"></span>
          <div class="w-9 h-9 rounded-2xl ${targetBadgeColor} text-white shadow-xl flex items-center justify-center border-2 border-white ring-2 ring-white/60 hover:scale-110 transition-transform">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <span class="mt-1 whitespace-nowrap px-2.5 py-0.5 rounded-lg bg-slate-950/95 text-white text-[9px] font-extrabold shadow-md border border-slate-700">
            ${targetLabelText}
          </span>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 46]
    });

    const targetMarker = L.marker([endLat, endLng], { icon: targetIcon, zIndexOffset: 960 });
    targetMarker.bindPopup(`
      <div class="text-xs space-y-1.5 max-w-[240px]">
        <span class="px-2 py-0.5 rounded text-white font-extrabold text-[10px] ${targetBadgeColor}">
          🎯 TITIK TUJUAN
        </span>
        <p class="font-extrabold text-slate-900 text-sm mt-1 leading-tight">${target?.name || 'Titik Sasaran'}</p>
        <p class="text-slate-600 text-[11px] leading-relaxed">${target?.address || target?.notes || ''}</p>
        <div class="pt-1.5 flex items-center justify-between text-[11px] font-bold border-t border-slate-200">
          <span class="text-blue-700 font-extrabold">${displayDistance}</span>
          <span class="text-emerald-700 font-extrabold">${displayDuration}</span>
        </div>
      </div>
    `);
    layerGroup.addLayer(targetMarker);

  }, [mapReady, userLat, userLng, target, smartRoutes, activeRouteId, hazards, allRoutesBlocked, accuracyText, currentStepIndex, displayDistance, displayDuration, targetLabelText, onSelectRoute, onStepClick]);

  // Controls
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  }, []);

  const handleCenterUser = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([Number.isFinite(userLat) ? userLat : -5.9860, Number.isFinite(userLng) ? userLng : 106.0344], 16, { animate: true });
    }
  }, [userLat, userLng]);

  const handleFitRoute = useCallback(() => {
    if (mapInstanceRef.current && activePolylineRef.current) {
      try {
        const bounds = activePolylineRef.current.getBounds();
        if (bounds && bounds.isValid && bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true
          });
        }
      } catch (e) {}
    }
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden border-2 border-slate-300 bg-[#E8ECEF] shadow-2xl text-slate-900 animate-fadeIn select-none">
      {/* 1. TOP FLOATING GOOGLE MAPS ORIGIN-DESTINATION CARD */}
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
                <span className="text-[10px] text-blue-600 font-bold shrink-0">
                  {accuracyText}
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 truncate">
                  {isReverse ? 'Lokasi Anda (GPS Aktif)' : targetLabelText}
                </span>
                <span className="text-[10px] text-emerald-700 font-extrabold shrink-0">
                  {displayDistance}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setIsReverse(!isReverse)}
              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Tukar arah rute"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL LEAFLET MAP DOM CONTAINER (Solid explicit height to avoid collapsing) */}
      <div className="w-full relative overflow-hidden bg-slate-900" style={{ height: '390px', minHeight: '370px' }}>
        <div ref={containerRef} className="w-full h-full z-0" />

        {/* Map Control Buttons (Floating on Map) */}
        <div className="absolute top-20 right-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center font-bold text-sm shadow-md transition-all cursor-pointer"
            title="Perbesar Peta (+)"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center font-bold text-sm shadow-md transition-all cursor-pointer"
            title="Perkecil Peta (-)"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleFitRoute}
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs shadow-md transition-all cursor-pointer"
            title="Pusatkan Seluruh Rute Jalan (Fit Bounds)"
          >
            🗺️
          </button>
          <button
            type="button"
            onClick={handleCenterUser}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center text-xs shadow-md transition-all cursor-pointer"
            title="Pusatkan ke Lokasi GPS Anda"
          >
            🎯
          </button>
        </div>

        {/* Watermark / Legend inside map */}
        <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between text-[10px] pointer-events-none">
          <div className="px-2.5 py-1 bg-slate-950/90 backdrop-blur-md rounded-lg border border-slate-700 text-slate-200 font-semibold flex items-center gap-2 shadow">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>OpenStreetMap & OSRM Engine · GPS ({accuracyText})</span>
          </div>
        </div>
      </div>

      {/* 3. GOOGLE MAPS MOBILE BOTTOM SHEET (Exact replica of tampilan rute.jpeg) */}
      <div className="bg-white border-t border-slate-300 p-4 space-y-3 shadow-2xl">
        {/* Row A: Transport Mode Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'motor', icon: '🏍️', label: 'Motor', time: displayDuration },
              { id: 'mobil', icon: '🚗', label: 'Mobil', time: '~38 mnt' },
              { id: 'bus', icon: '🚌', label: 'Armada', time: '~30 mnt' },
              { id: 'jalan', icon: '🚶', label: 'Jalan', time: '4j 15m' }
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

          <div className="flex items-center gap-1 text-slate-500">
            <button
              type="button"
              onClick={() => onSelectRoute && altRoute && onSelectRoute(altRoute.id)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="Ganti rute"
            >
              <span>🔀</span>
              <span className="hidden sm:inline">Rute Opsi</span>
            </button>
          </div>
        </div>

        {/* Row B: Smart Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => onSelectRoute && onSelectRoute('route-0')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer border ${
              activeRouteId === 'route-0' && !isMainBlocked
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            ✓ Rute Tercepat (Tol)
          </button>

          {altRoute && (
            <button
              type="button"
              onClick={() => onSelectRoute && onSelectRoute(altRoute.id)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer border ${
                activeRouteId === altRoute.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              ✓ Hindari Tol (Arteri)
            </button>
          )}

          <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold whitespace-nowrap">
            Status: {activeRoute?.statusLabel || 'Belum ada laporan bahaya terdata'}
          </span>
        </div>

        {/* Row C: Highlighted Travel Time & Road Condition Alert */}
        <div className="space-y-1">
          {isMainBlocked ? (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 text-xs font-bold flex items-start gap-2 shadow-xs">
              <span className="text-base shrink-0 mt-0.5">⛔</span>
              <div>
                <p className="font-extrabold text-rose-900 text-sm">
                  Penutupan Jalan: {activeRoute?.blockedBy?.[0]?.road_name || 'Simpang Drangong'}
                </p>
                <p className="text-[11px] font-semibold text-rose-800 mt-0.5">
                  Banjir {activeRoute?.blockedBy?.[0]?.water_depth || '65 cm'} (Terverifikasi BPBD). Jalur dialihkan ke rute alternatif yang layak.
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
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                <span>🍃 {activeRoute?.selectionReason || 'Rute dengan estimasi waktu tercepat dan jalur layak.'}</span>
              </p>
            </div>
          )}
        </div>

        {/* Row D: Primary Action Buttons */}
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
              className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>🔀 Ganti Rute</span>
            </button>
          )}

          <a
            href="tel:115"
            className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 font-extrabold text-xs flex items-center justify-center transition-all shadow-sm"
            title="Panggil Tim SAR Darurat"
          >
            <span className="font-bold">SAR 115</span>
          </a>
        </div>
      </div>
    </div>
  );
}
