import { getRoadHazards, calculateDistance } from '../../../../src/lib/disasterDb.js';

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org';
const OSRM_BASE_URL = process.env.ROUTING_ENGINE_URL || 'https://router.project-osrm.org';

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} meter`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin > 0 ? `${hours}j ${remainingMin}m` : `${hours} jam`;
}

function translateManeuverModifier(modifier) {
  switch (modifier) {
    case 'right': return 'kanan';
    case 'slight right': return 'agak ke kanan';
    case 'sharp right': return 'tajam ke kanan';
    case 'left': return 'kiri';
    case 'slight left': return 'agak ke kiri';
    case 'sharp left': return 'tajam ke kiri';
    case 'straight': return 'lurus';
    case 'uturn': return 'balik';
    default: return 'depan';
  }
}

function translateManeuver(type, modifier) {
  if (type === 'turn' || type === 'end of road') {
    if (modifier?.includes('right')) return 'Belok kanan';
    if (modifier?.includes('left')) return 'Belok kiri';
    if (modifier === 'straight') return 'Lurus terus';
    if (modifier === 'uturn') return 'Putar balik';
    return 'Belok';
  }
  if (type === 'new name') return 'Lanjutkan ke';
  if (type === 'fork') return modifier?.includes('left') ? 'Ambil percabangan kiri' : 'Ambil percabangan kanan';
  if (type === 'roundabout' || type === 'rotary') return 'Masuk bundaran dan ambil arah keluar';
  if (type === 'on ramp') return 'Masuk ke jalan akses';
  if (type === 'off ramp') return 'Keluar ke jalan akses';
  return 'Lanjutkan';
}

function checkRouteHazards(coordinates, activeHazards) {
  const blockedBy = [];
  const impactedBy = [];

  for (let i = 0; i < coordinates.length; i += 3) {
    const [pLat, pLng] = coordinates[i];
    for (const h of activeHazards) {
      if (!h.active && !h.is_blocked_by_community) continue;
      const dist = calculateDistance(pLat, pLng, h.lat, h.lng);
      if (dist <= (h.radius_meters || 150)) {
        if (h.is_blocked_by_community || (h.status === 'verified' && h.severity === 'closed')) {
          if (!blockedBy.some(x => x.id === h.id)) blockedBy.push(h);
        } else if (h.severity === 'passable_caution') {
          if (!impactedBy.some(x => x.id === h.id)) impactedBy.push(h);
        }
      }
    }
  }

  return {
    isBlocked: blockedBy.length > 0,
    isImpacted: impactedBy.length > 0,
    blockedBy,
    impactedBy
  };
}

function processOsrmSteps(steps = []) {
  const result = [];
  let stepNum = 1;

  for (const s of steps) {
    if (s.distance < 5 && stepNum > 1 && s.maneuver?.type !== 'arrive') continue;
    const isArrival = s.maneuver?.type === 'arrive';
    const isDepart = s.maneuver?.type === 'depart';
    const streetName = s.name && s.name !== '-' ? s.name : 'jalan utama';

    let title = '';
    let instructionText = '';

    if (isDepart) {
      title = `Mulai dari ${streetName}`;
      instructionText = `Berangkat ke arah ${translateManeuverModifier(s.maneuver?.modifier)} melalui ${streetName} sejauh ${formatDistance(s.distance)}`;
    } else if (isArrival) {
      title = 'Tiba di lokasi tujuan';
      instructionText = 'Anda telah tiba di titik tujuan evakuasi / posko.';
    } else {
      const action = translateManeuver(s.maneuver?.type, s.maneuver?.modifier);
      title = `${action} ${s.name ? 'ke ' + s.name : ''}`.trim();
      instructionText = `${title}, lanjutkan sejauh ${formatDistance(s.distance)}`;
    }

    const stepCoord = s.maneuver?.location ? [s.maneuver.location[1], s.maneuver.location[0]] : null;

    result.push({
      step: stepNum++,
      title,
      instruction: instructionText,
      distanceMeters: Math.round(s.distance),
      durationSeconds: Math.round(s.duration),
      lat: stepCoord ? stepCoord[0] : null,
      lng: stepCoord ? stepCoord[1] : null,
      isArrival
    });
  }

  return result;
}

// Fetch OSRM Real Road Route
async function fetchOsrmRoute(profile, startLng, startLat, endLng, endLat, viaLng = null, viaLat = null) {
  const coordsPath = viaLng !== null && viaLat !== null
    ? `${startLng},${startLat};${viaLng},${viaLat};${endLng},${endLat}`
    : `${startLng},${startLat};${endLng},${endLat}`;

  const url = `${OSRM_BASE_URL}/route/v1/${profile}/${coordsPath}?overview=full&geometries=geojson&steps=true&alternatives=true`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[OSRM Routing Error]', err.message);
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startLat = Number(searchParams.get('startLat'));
    const startLng = Number(searchParams.get('startLng'));
    const endLat = Number(searchParams.get('endLat'));
    const endLng = Number(searchParams.get('endLng'));
    const mode = searchParams.get('mode') === 'walking' ? 'walking' : 'driving';

    if (
      ![startLat, startLng, endLat, endLng].every(Number.isFinite)
      || Math.abs(startLat) > 90 || Math.abs(endLat) > 90
      || Math.abs(startLng) > 180 || Math.abs(endLng) > 180
    ) {
      return Response.json(
        { success: false, error: 'Koordinat awal dan tujuan wajib valid.' },
        { status: 400 }
      );
    }

    // Jika ALLOW_EXTERNAL_ROUTING diset eksplisit 'false', tolak
    if (process.env.ALLOW_EXTERNAL_ROUTING === 'false') {
      return Response.json(
        { success: false, error: 'Routing eksternal belum diaktifkan.' },
        { status: 503 }
      );
    }

    const osrmProfile = mode === 'walking' ? 'foot' : 'driving';
    const allHazards = await getRoadHazards().catch(() => []);
    const activeHazards = allHazards.filter(h => h.active || h.is_blocked_by_community);

    // 1. Ambil rute utama via OSRM
    const osrmData = await fetchOsrmRoute(osrmProfile, startLng, startLat, endLng, endLat);
    const osrmRoutes = osrmData?.routes || [];

    if (osrmRoutes.length === 0) {
      return Response.json(
        { success: false, error: 'Tidak dapat menghitung rute jalan untuk titik ini.' },
        { status: 503 }
      );
    }

    // Ambil rute kandidat (rute 1 dan rute 2)
    const rawCandidateRoutes = [...osrmRoutes];

    // Jika OSRM hanya mengembalikan 1 rute, buat rute alternatif via jalur samping
    if (rawCandidateRoutes.length < 2) {
      const dx = endLng - startLng;
      const dy = endLat - startLat;
      const viaLng = parseFloat((startLng + dx * 0.5 - dy * 0.12).toFixed(5));
      const viaLat = parseFloat((startLat + dy * 0.5 + dx * 0.12).toFixed(5));
      const altOsrmData = await fetchOsrmRoute(osrmProfile, startLng, startLat, endLng, endLat, viaLng, viaLat);
      if (altOsrmData?.routes?.[0]) {
        rawCandidateRoutes.push(altOsrmData.routes[0]);
      }
    }

    const selectedRoutes = rawCandidateRoutes.slice(0, 2);

    let processedRoutes = selectedRoutes.map((route, idx) => {
      // OSRM coordinates: [lng, lat] -> convert to Leaflet: [lat, lng]
      const rawCoords = route.geometry?.coordinates || [];
      const coordinates = rawCoords.map(([lng, lat]) => [lat, lng]);

      const hazardCheck = checkRouteHazards(coordinates, activeHazards);
      const allSteps = (route.legs || []).flatMap(leg => leg.steps || []);

      // Traffic & mode calibration
      const trafficFactor = mode === 'walking' ? 1.0 : 1.45;
      let durationSeconds = Math.round((route.duration || 0) * trafficFactor);
      if (hazardCheck.isImpacted) durationSeconds += 600;

      const distanceMeters = Math.round(route.distance || 0);
      const steps = processOsrmSteps(allSteps);

      // Ekstrak nama jalan nyata dari langkah perjalanan
      const uniqueRoads = [];
      for (const s of allSteps) {
        if (s.name && s.name !== '-' && !uniqueRoads.includes(s.name) && uniqueRoads.length < 3) {
          uniqueRoads.push(s.name);
        }
      }

      const realRoadSummary = uniqueRoads.length > 0
        ? `Lewat ${uniqueRoads.join(' → ')}`
        : (idx === 0 ? 'Rute Utama Terverifikasi OpenStreetMap' : 'Jalur Alternatif Arteri Sekunder');

      let statusLabel = 'Jalur Bebas Hambatan';
      let isViable = true;

      if (hazardCheck.isBlocked) {
        isViable = false;
        const b = hazardCheck.blockedBy[0];
        statusLabel = b.is_blocked_by_community
          ? `Diblokir ${b.report_count || 5} Laporan Warga`
          : `Ditutup: ${b?.hazard_type || 'Bahaya'} di ${b?.road_name || 'ruas jalan'}`;
      } else if (hazardCheck.isImpacted) {
        const im = hazardCheck.impactedBy[0];
        statusLabel = `Waspada Genangan: ${im?.road_name || ''}`;
      }

      return {
        id: `route-${idx}`,
        routeNumber: idx + 1,
        name: idx === 0 ? 'Rute 1 (Jalur Tercepat)' : `Rute ${idx + 1} (Jalur Alternatif)`,
        summary: realRoadSummary,
        coordinates,
        distanceMeters,
        distanceFormatted: formatDistance(distanceMeters),
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        steps,
        statusLabel,
        isViable,
        isBlocked: hazardCheck.isBlocked,
        isImpacted: hazardCheck.isImpacted,
        blockedBy: hazardCheck.blockedBy,
        impactedBy: hazardCheck.impactedBy
      };
    });

    const viableRoutes = processedRoutes.filter(r => r.isViable && !r.isBlocked);
    const allRoutesBlocked = processedRoutes.length > 0 && viableRoutes.length === 0;

    viableRoutes.sort((a, b) => {
      const dt = a.durationSeconds - b.durationSeconds;
      if (Math.abs(dt) <= 60) return a.distanceMeters - b.distanceMeters;
      return dt;
    });

    const bestRouteId = viableRoutes[0]?.id || processedRoutes[0]?.id || null;

    processedRoutes = processedRoutes.map((r) => {
      const isRec = r.id === bestRouteId && !r.isBlocked;
      let selectionReason = '';
      if (isRec) {
        selectionReason = `Rute tercepat mengikuti jaringan jalan nyata (${r.durationFormatted}, ${r.distanceFormatted}) — rute jalan terverifikasi OpenStreetMap.`;
      } else if (r.isBlocked) {
        selectionReason = `Laporan bahaya bencana beririsan dengan ruas jalan ini.`;
      } else {
        selectionReason = `Jalur alternatif siaga (${r.durationFormatted}, ${r.distanceFormatted}).`;
      }
      return { ...r, isRecommended: isRec, selectionReason };
    });

    return Response.json({
      success: true,
      data_status: 'live',
      source: 'openstreetmap_osrm',
      routingEngine: 'OpenStreetMap OSRM Road Network',
      timestamp: new Date().toISOString(),
      data: {
        routes: processedRoutes,
        recommendedRouteId: bestRouteId,
        allRoutesBlocked,
        detourNotice: allRoutesBlocked ? 'Seluruh akses rute darat terhalang bahaya.' : null,
        activeHazardsCount: activeHazards.length
      }
    });
  } catch (error) {
    console.error('API /api/map/routing error:', error);
    return Response.json(
      { success: false, error: 'Gagal memproses rute jalan.' },
      { status: 500 }
    );
  }
}
