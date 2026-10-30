import { NextResponse } from 'next/server';
import { getRoadHazards, calculateDistance } from '../../../../src/lib/disasterDb.js';

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org';

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

function orsProfile(mode) {
  if (mode === 'walking') return 'foot-walking';
  return 'driving-car';
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

function processSteps(segments = [], coordinates = []) {
  const steps = [];
  let stepNum = 1;
  for (const seg of segments) {
    for (const s of (seg.steps || [])) {
      if (s.distance < 5 && stepNum > 1 && s.type !== 10) continue;
      const wpIdx = Array.isArray(s.way_points) ? s.way_points[0] : null;
      const stepCoord = wpIdx !== null && coordinates[wpIdx] ? coordinates[wpIdx] : null;

      const isArrival = s.type === 10;
      let title = s.instruction || (s.name && s.name !== '-' ? `Lewat ${s.name}` : (isArrival ? 'Tiba di tujuan' : 'Ikuti jalan utama'));
      let instructionText = s.instruction;
      if (!instructionText) {
        instructionText = isArrival ? 'Anda telah tiba di lokasi tujuan' : `Lanjutkan sejauh ${formatDistance(s.distance)}`;
      } else if (!isArrival && s.distance > 0) {
        instructionText = `${s.instruction} sejauh ${formatDistance(s.distance)}`;
      }

      steps.push({
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
  }
  return steps;
}

async function fetchOrsRoute(profile, startLng, startLat, endLng, endLat, apiKey) {
  const url = `${ORS_BASE_URL}/v2/directions/${profile}/geojson`;
  const body = {
    coordinates: [
      [startLng, startLat],
      [endLng, endLat]
    ],
    instructions: true,
    geometry: true,
    geometry_simplify: false,
    alternative_routes: { target_count: 3, share_factor: 0.9, weight_factor: 2.0 },
    language: 'id'
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json'
      },
      body: JSON.stringify(body)
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[ORS] HTTP ${res.status}:`, errText.slice(0, 200));
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[ORS] Request failed:', err.message);
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
      return NextResponse.json(
        { success: false, error: 'Koordinat awal dan tujuan wajib valid.' },
        { status: 400 }
      );
    }

    if (!ORS_API_KEY || process.env.ALLOW_EXTERNAL_ROUTING !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Routing eksternal belum diaktifkan.' },
        { status: 503 }
      );
    }

    const profile = orsProfile(mode);

    const [allHazards, orsData] = await Promise.all([
      getRoadHazards().catch(() => []),
      fetchOrsRoute(profile, startLng, startLat, endLng, endLat, ORS_API_KEY)
    ]);

    const activeHazards = allHazards.filter(h => h.active || h.is_blocked_by_community);
    const features = orsData?.features || [];

    if (features.length === 0) {
      return NextResponse.json(
        { success: false, error: 'OpenRouteService tidak dapat menghitung rute untuk titik ini.' },
        { status: 503 }
      );
    }

    // Process up to 2 distinct real routes returned by ORS
    const selectedFeatures = features.slice(0, 2);
    let processedRoutes = selectedFeatures.map((feature, idx) => {
      // ORS GeoJSON coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
      const rawCoords = feature.geometry?.coordinates || [];
      const coordinates = rawCoords.map(([lng, lat]) => [lat, lng]);

      const hazardCheck = checkRouteHazards(coordinates, activeHazards);
      const summary = feature.properties?.summary || {};

      // Real-world Indonesian traffic & terrain calibration
      // Driving on Indonesian city & Pantura arterials averages ~32-35 km/h (matching Google Maps benchmark: 21.6 km ~38 min)
      const trafficFactor = mode === 'walking' ? 1.0 : 1.75;
      let durationSeconds = Math.round((summary.duration || 0) * trafficFactor);
      if (hazardCheck.isImpacted) durationSeconds += 900; // penalti jika genangan sedang

      const distanceMeters = Math.round(summary.distance || 0);
      const steps = processSteps(feature.properties?.segments || [], coordinates);

      // Extract real road names from steps for realistic summary
      const uniqueRoads = [];
      for (const s of (feature.properties?.segments?.[0]?.steps || [])) {
        if (s.name && s.name !== '-' && !uniqueRoads.includes(s.name) && uniqueRoads.length < 3) {
          uniqueRoads.push(s.name);
        }
      }
      const realRoadSummary = uniqueRoads.length > 0
        ? `Lewat ${uniqueRoads.join(' → ')}`
        : (idx === 0 ? 'Rute Utama Terverifikasi ORS' : 'Jalur Alternatif Terverifikasi ORS');

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
        selectionReason = `Rute tercepat via OpenRouteService (${r.durationFormatted}, ${r.distanceFormatted}) — jalur jalan nyata terverifikasi.`;
      } else if (r.isBlocked) {
        selectionReason = `Laporan bahaya bencana beririsan dengan ruas jalan ini.`;
      } else {
        selectionReason = `Jalur alternatif siaga (${r.durationFormatted}, ${r.distanceFormatted}).`;
      }
      return { ...r, isRecommended: isRec, selectionReason };
    });

    return NextResponse.json({
      success: true,
      data_status: 'live',
      source: 'openrouteservice',
      routingEngine: 'OpenRouteService API (HeiGIT)',
      timestamp: new Date().toISOString(),
      data: {
        routes: processedRoutes,
        recommendedRouteId: bestRouteId,
        allRoutesBlocked,
        detourNotice: allRoutesBlocked ? 'Seluruh akses rute darat terdampak bahaya bencana.' : null,
        activeHazardsCount: activeHazards.length
      }
    });

  } catch (error) {
    console.error('API /api/map/routing error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses rute.' },
      { status: 500 }
    );
  }
}
