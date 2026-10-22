'use client';

import React, { useEffect, useRef } from 'react';

export default function LeafletMapCanvas({
  userLat,
  userLng,
  isRealGpsActive,
  isUserInDanger,
  userStatus,
  accuracyText,
  poskoList = [],
  wargaList = [],
  laporanDaruratList = [],
  selectedItem,
  onSelectItem,
  onNavigateRoute,
  mapControlRef
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Leaflet Map once on client
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !containerRef.current) return;
      if (mapInstanceRef.current) return; // already initialized

      // Dynamically import Leaflet to ensure window exists
      const L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      // Fix Leaflet default icon paths in bundlers
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Create Leaflet map instance
      const map = L.map(containerRef.current, {
        center: [userLat, userLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: true
      });

      // Add OpenStreetMap Tile Layer with proper attribution & policy compliance
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> kontributor'
      }).addTo(map);

      // Create a layer group for dynamic markers & circles
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Expose map controls to parent ref
      if (mapControlRef) {
        mapControlRef.current = {
          zoomIn: () => map.zoomIn(),
          zoomOut: () => map.zoomOut(),
          centerToUser: (lat, lng) => map.setView([lat, lng], 15, { animate: true }),
          flyTo: (lat, lng, zoom = 16) => map.flyTo([lat, lng], zoom, { animate: true })
        };
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update center when real GPS is first activated
  useEffect(() => {
    if (mapInstanceRef.current && isRealGpsActive) {
      mapInstanceRef.current.panTo([userLat, userLng], { animate: true });
    }
  }, [isRealGpsActive, userLat, userLng]);

  // Render / Re-render dynamic Leaflet markers and 1km privacy circles
  useEffect(() => {
    let isCancelled = false;

    async function updateMarkers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = (await import('leaflet')).default;
      if (isCancelled || !layerGroupRef.current) return;

      const layerGroup = layerGroupRef.current;
      layerGroup.clearLayers();

      // Global window bridge for Leaflet HTML popups
      if (typeof window !== 'undefined') {
        window.__leafNavigateRoute = (encoded) => {
          try {
            const parsed = JSON.parse(decodeURIComponent(encoded));
            if (onNavigateRoute) onNavigateRoute(parsed);
          } catch (e) {
            console.error('Error navigating to route:', e);
          }
        };
      }

      // 1. RENDER USER MARKER & 1KM PRIVACY CIRCLE
      if (isUserInDanger) {
        // DANGER SOS MODE: Exact Pinpoint Beacon (No 1km privacy circle)
        const sosIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
              <span class="absolute -top-1 w-10 h-10 rounded-full bg-rose-500/50 animate-ping"></span>
              <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white shadow-xl flex items-center justify-center border-2 border-white ring-2 ring-rose-500/60 sos-beacon">
                <svg class="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <span class="mt-1 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-rose-950 text-white text-[10px] font-extrabold shadow-md flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                PIN SOS AKTIF
              </span>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50]
        });

        const userSosMarker = L.marker([userLat, userLng], { icon: sosIcon, zIndexOffset: 1000 });
        userSosMarker.bindPopup(`
          <div class="text-xs space-y-1">
            <span class="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px]">🚨 LOKASI PRESISI AKTIF</span>
            <p class="font-bold text-slate-900 mt-1">Titik Darurat Anda (GPS Aktual)</p>
            <p class="text-slate-600 text-[11px]">Koordinat presisi terbuka untuk tim SAR dan posko terdekat.</p>
            <p class="text-[10px] font-mono text-slate-500">${userLat.toFixed(5)}, ${userLng.toFixed(5)} (${accuracyText})</p>
          </div>
        `);
        userSosMarker.on('click', () => {
          onSelectItem({
            type: 'user',
            name: 'Lokasi Anda (Mode Darurat)',
            lat: userLat,
            lng: userLng,
            status: 'help',
            notes: 'PIN Presisi aktif dibuka untuk penyelamatan dan evakuasi darurat.',
            accuracy: accuracyText
          });
        });
        layerGroup.addLayer(userSosMarker);
      } else {
        // NORMAL / SAFE MODE: 1 km Approximate Privacy Circle + Soft Navigation Dot
        const privacyCircle = L.circle([userLat, userLng], {
          radius: 1000, // 1 km in meters
          color: '#0D47A1',
          fillColor: '#2196F3',
          fillOpacity: 0.16,
          weight: 2,
          dashArray: '6, 6'
        });
        privacyCircle.bindPopup(`
          <div class="text-xs space-y-1">
            <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">🔵 RADIUS PRIVASI 1 KM</span>
            <p class="font-bold text-slate-900 mt-1">Area Perkiraan Lokasi Anda</p>
            <p class="text-slate-600 text-[11px]">Orang lain hanya melihat lingkaran radius perkiraan 1 km ini. Koordinat rumah Anda dirahasiakan.</p>
          </div>
        `);
        privacyCircle.on('click', () => {
          onSelectItem({
            type: 'user',
            name: 'Lokasi Anda (Radius 1 km Privasi)',
            lat: userLat,
            lng: userLng,
            status: 'safe',
            notes: 'Warga lain hanya melihat area perkiraan radius 1 km ini untuk menjaga privasi rumah Anda.',
            accuracy: accuracyText
          });
        });
        layerGroup.addLayer(privacyCircle);

        const normalIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="relative flex flex-col items-center" style="transform: translate(-50%, -50%);">
              <div class="w-8 h-8 rounded-full bg-[#0D47A1] text-white shadow-lg flex items-center justify-center border-2 border-white ring-2 ring-blue-300">
                <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>
              <span class="mt-1 whitespace-nowrap px-2 py-0.5 rounded-md bg-blue-900/90 text-white text-[9px] font-bold shadow-md">
                Anda (Privasi 1km)
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const userNormalMarker = L.marker([userLat, userLng], { icon: normalIcon, zIndexOffset: 900 });
        userNormalMarker.on('click', () => {
          onSelectItem({
            type: 'user',
            name: 'Lokasi Anda (Radius 1 km Privasi)',
            lat: userLat,
            lng: userLng,
            status: 'safe',
            notes: 'Koordinat GPS aktual perangkat Anda terlindungi oleh radius privasi 1 km.',
            accuracy: accuracyText
          });
        });
        layerGroup.addLayer(userNormalMarker);
      }

      // 2. RENDER DATABASE POSKO MARKERS (Shelters)
      poskoList.forEach(posko => {
        const poskoIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
              <div class="w-8 h-8 rounded-2xl bg-emerald-600 text-white shadow-md flex items-center justify-center border-2 border-white ring-2 ring-emerald-300 hover:scale-110 transition-transform">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              </div>
              <span class="mt-0.5 whitespace-nowrap px-1.5 py-0.5 rounded bg-emerald-950 text-white text-[9px] font-bold shadow-sm">
                Posko
              </span>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42]
        });

        const marker = L.marker([posko.lat, posko.lng], { icon: poskoIcon });
        marker.bindPopup(`
          <div class="text-xs space-y-1">
            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">POSKO EVAKUASI RESMI</span>
            <p class="font-extrabold text-slate-900 mt-1">${posko.name}</p>
            <p class="text-slate-600 text-[11px]">${posko.address}</p>
            <p class="text-[11px] text-emerald-800 font-semibold">Kapasitas: ${posko.capacity}</p>
            <p class="text-[10px] text-slate-500">Fasilitas: ${posko.facilities?.join(', ')}</p>
            <p class="text-[10px] font-bold text-blue-700">Jarak: ${posko.distanceFormatted} (${posko.estWalkTime} jalan kaki)</p>
            <button onclick="window.__leafNavigateRoute('${encodeURIComponent(JSON.stringify(posko))}')" class="w-full mt-2 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 shadow cursor-pointer">🧭 Arahkan Rute ke Posko Ini</button>
          </div>
        `);
        marker.on('click', () => onSelectItem({ ...posko, itemType: 'posko' }));
        layerGroup.addLayer(marker);
      });

      // 3. RENDER DATABASE WARGA MARKERS (1km Privacy Circles for Neighbors)
      wargaList.forEach(warga => {
        // Lingkaran radius perkiraan 1 km untuk masing-masing warga
        const circleColor = warga.can_help ? '#059669' : '#D97706';
        const circle = L.circle([warga.lat, warga.lng], {
          radius: 1000,
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.08,
          weight: 1,
          dashArray: '4, 4'
        });
        circle.on('click', () => onSelectItem({ ...warga, itemType: 'warga' }));
        layerGroup.addLayer(circle);

        const wargaIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="relative flex flex-col items-center" style="transform: translate(-50%, -50%);">
              <div class="w-6 h-6 rounded-full ${warga.can_help ? 'bg-emerald-600' : 'bg-amber-500'} text-white shadow-md flex items-center justify-center border-2 border-white ring-2 ring-slate-200 hover:scale-110 transition-transform">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <span class="mt-0.5 whitespace-nowrap px-1.5 py-0.5 rounded bg-white/95 text-slate-800 text-[8px] font-bold border border-slate-200 shadow-xs">
                ${warga.alias.split(' ')[0]} • 1km
              </span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const wargaMarker = L.marker([warga.lat, warga.lng], { icon: wargaIcon });
        wargaMarker.bindPopup(`
          <div class="text-xs space-y-1">
            <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">WARGA • RADIUS 1 KM</span>
            <p class="font-extrabold text-slate-900 mt-1">${warga.alias}</p>
            <p class="text-slate-600 text-[11px]">${warga.area}</p>
            <p class="text-[11px] text-slate-700">${warga.notes}</p>
            <p class="text-[10px] font-semibold text-blue-700">Jarak: ${warga.distanceFormatted} (${warga.estWalkTime})</p>
            <button onclick="window.__leafNavigateRoute('${encodeURIComponent(JSON.stringify(warga))}')" class="w-full mt-2 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 shadow cursor-pointer">🧭 Arahkan Rute ke Lokasi Ini</button>
          </div>
        `);
        wargaMarker.on('click', () => onSelectItem({ ...warga, itemType: 'warga' }));
        layerGroup.addLayer(wargaMarker);
      });

      // 4. RENDER DATABASE LAPORAN DARURAT / BENCANA MARKERS
      laporanDaruratList.forEach(report => {
        const reportIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
              <span class="absolute -top-1 w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></span>
              <div class="w-8 h-8 rounded-2xl bg-gradient-to-tr from-rose-700 to-red-600 text-white shadow-lg flex items-center justify-center border-2 border-white ring-2 ring-rose-400 hover:scale-110 transition-transform">
                <svg class="w-4 h-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <span class="mt-0.5 whitespace-nowrap px-1.5 py-0.5 rounded bg-rose-950 text-white text-[9px] font-extrabold shadow flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                ${report.urgency_level || 'DARURAT'}
              </span>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42]
        });

        const reportMarker = L.marker([report.lat, report.lng], { icon: reportIcon, zIndexOffset: 950 });
        reportMarker.bindPopup(`
          <div class="text-xs space-y-1.5 max-w-[240px]">
            <div class="flex items-center gap-1">
              <span class="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px]">🚨 BUTUH BANTUAN SEGERA</span>
              <span class="text-[10px] text-slate-500">• ${report.reported_at}</span>
            </div>
            <p class="font-extrabold text-slate-900 text-sm leading-tight">${report.reporter_name}</p>
            <p class="text-slate-600 text-[11px] leading-relaxed">${report.needs_description}</p>
            ${report.vulnerable_members ? `<p class="text-[11px] text-rose-700 font-bold">Keluarga: ${report.vulnerable_members}</p>` : ''}
            <div class="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200">
              <span class="font-semibold text-blue-700">${report.distanceFormatted}</span>
              <a href="tel:${report.contact || '112'}" class="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">Hubungi</a>
            </div>
            <button onclick="window.__leafNavigateRoute('${encodeURIComponent(JSON.stringify(report))}')" class="w-full mt-1.5 py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[10px] flex items-center justify-center gap-1 shadow cursor-pointer">🧭 Arahkan Rute Penyelamatan</button>
          </div>
        `);
        reportMarker.on('click', () => onSelectItem({ ...report, itemType: 'laporan_darurat' }));
        layerGroup.addLayer(reportMarker);
      });
    }

    updateMarkers();

    return () => {
      isCancelled = true;
    };
  }, [userLat, userLng, isUserInDanger, accuracyText, poskoList, wargaList, laporanDaruratList, onSelectItem]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full min-h-[480px] sm:min-h-[540px] rounded-3xl overflow-hidden" />
    </div>
  );
}
