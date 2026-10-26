import { NextResponse } from 'next/server';
import { getRoadHazards, calculateDistance } from '../../../../src/lib/disasterDb.js';

const ROUTING_BASE_URL = process.env.ROUTING_ENGINE_URL;

function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} meter`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds, mode = 'driving') {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) {
    return `${minutes} mnt`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin > 0 ? `${hours}j ${remainingMin}m` : `${hours} jam`;
}

// Check intersection of a polyline with active disaster hazards
function checkRouteHazards(coordinates, activeHazards) {
  const blockedBy = [];
  const impactedBy = [];
  const unverifiedWarnings = [];

  // Check every 3rd point for efficiency along the polyline
  for (let i = 0; i < coordinates.length; i += 2) {
    const [pLat, pLng] = coordinates[i];

    for (const h of activeHazards) {
      if (!h.active) continue;

      const dist = calculateDistance(pLat, pLng, h.lat, h.lng);
      if (dist <= (h.radius_meters || 150)) {
        if (h.status === 'verified' && h.severity === 'closed') {
          if (!blockedBy.some(item => item.id === h.id)) {
            blockedBy.push(h);
          }
        } else if (h.severity === 'passable_caution') {
          if (!impactedBy.some(item => item.id === h.id)) {
            impactedBy.push(h);
          }
        } else if (h.status === 'unverified') {
          if (!unverifiedWarnings.some(item => item.id === h.id)) {
            unverifiedWarnings.push(h);
          }
        }
      }
    }
  }

  return {
    isBlocked: blockedBy.length > 0,
    isImpacted: impactedBy.length > 0,
    hasUnverifiedWarning: unverifiedWarnings.length > 0,
    blockedBy,
    impactedBy,
    unverifiedWarnings
  };
}

// Convert OSRM raw steps to clean turn-by-turn guidance
function processSteps(rawSteps = []) {
  return rawSteps
    .filter(s => s.maneuver && s.distance > 8)
    .slice(0, 6)
    .map((s, idx) => {
      let title = s.name ? `Lewat ${s.name}` : `Ikuti jalur jalan utama`;
      if (s.maneuver?.type === 'depart') title = 'Mulai melaju dari lokasi Anda';
      if (s.maneuver?.type === 'arrive') title = 'Tiba di gerbang lokasi tujuan';
      if (s.maneuver?.modifier) {
        const mod = s.maneuver.modifier;
        if (mod.includes('left')) title = `Belok kiri ke ${s.name || 'jalan berikutnya'}`;
        if (mod.includes('right')) title = `Belok kanan ke ${s.name || 'jalan berikutnya'}`;
      }
      return {
        step: idx + 1,
        title,
        instruction: `Lanjutkan sejauh ${formatDistance(s.distance)} (~${Math.max(1, Math.round(s.duration / 60))} mnt).`,
        distanceMeters: s.distance,
        lat: s.maneuver.location[1],
        lng: s.maneuver.location[0]
      };
    });
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
      || Math.abs(startLat) > 90
      || Math.abs(endLat) > 90
      || Math.abs(startLng) > 180
      || Math.abs(endLng) > 180
    ) {
      return NextResponse.json(
        { success: false, error: 'Koordinat awal dan tujuan wajib valid.' },
        { status: 400 }
      );
    }

    if (!ROUTING_BASE_URL || process.env.ALLOW_EXTERNAL_ROUTING !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Routing eksternal belum diaktifkan dan tidak ada rute demo yang akan dibuat.' },
        { status: 503 }
      );
    }

    // 1. Fetch active disaster road hazards from database
    const allHazards = await getRoadHazards();
    const activeHazards = allHazards.filter(h => h.active);

    // Coordinates are sent only to a routing engine explicitly enabled by the operator.
    const osrmUrl = `${ROUTING_BASE_URL}/route/v1/${mode}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;

    let osrmRoutes = [];
    const routingSource = 'configured_routing_engine';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(osrmUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AIDisaster-SmartRouting/1.0' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          osrmRoutes = data.routes;
        }
      }
    } catch (osrmError) {
      clearTimeout(timeoutId);
      console.warn('Configured routing engine request failed:', osrmError.message);
    }

    if (osrmRoutes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Routing engine tidak mengembalikan rute. Tidak ada rute perkiraan yang dibuat.' },
        { status: 503 }
      );
    }

    // 3. Process routes returned by the configured road routing engine.
    let processedRoutes = osrmRoutes.map((route, idx) => {
        const coordinates = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);
        const hazardCheck = checkRouteHazards(coordinates, activeHazards);
        let durationSeconds = Math.round(route.duration);
        if (hazardCheck.isImpacted) {
          // Apply realistic penalty of +15 minutes for waterlogged/impacted passable segments
          durationSeconds += 900;
        }

        const defaultSummary = route.legs?.[0]?.summary || 'Rute dari layanan jalan yang dikonfigurasi';

        let statusBadge = 'unknown_reports';
        let statusLabel = 'Data kondisi jalan langsung tidak tersedia';
        let isViable = true;

        if (hazardCheck.isBlocked) {
          isViable = false;
          statusBadge = 'blocked';
          const blocker = hazardCheck.blockedBy[0];
          statusLabel = `Laporan penutupan jalan: ${blocker?.hazard_type || 'Bahaya'} (${blocker?.road_name || 'ruas jalan'}). Verifikasi langsung dengan petugas.`;
        } else if (hazardCheck.isImpacted) {
          statusBadge = 'impacted';
          const impacter = hazardCheck.impactedBy[0];
          statusLabel = `Laporan kondisi jalan: ${impacter?.description || 'Periksa kondisi secara langsung.'}`;
        } else if (hazardCheck.hasUnverifiedWarning) {
          statusBadge = 'warning_unverified';
          const warning = hazardCheck.unverifiedWarnings[0];
          statusLabel = `Waspada: Laporan warga belum diverifikasi (${warning?.description || 'Potensi hambatan'})`;
        }

        return {
          id: `route-${idx}`,
          routeNumber: idx + 1,
          name: idx === 0 ? 'Rute 1 (Jalur Utama)' : `Rute ${idx + 1} (Jalur Alternatif)`,
          summary: defaultSummary,
          coordinates,
          distanceMeters: Math.round(route.distance),
          distanceFormatted: formatDistance(route.distance),
          durationSeconds,
          durationFormatted: formatDuration(durationSeconds, mode),
          steps: processSteps(route.legs?.[0]?.steps),
          statusBadge,
          statusLabel,
          isViable,
          isBlocked: hazardCheck.isBlocked,
          isImpacted: hazardCheck.isImpacted,
          hasUnverifiedWarning: hazardCheck.hasUnverifiedWarning,
          blockedBy: hazardCheck.blockedBy,
          impactedBy: hazardCheck.impactedBy,
          unverifiedWarnings: hazardCheck.unverifiedWarnings
        };
      });

    // 4. SMART ROUTING SELECTION LOGIC (Aturan 1 - 4 & 6, 9)
    // Aturan 1 & 2: Prioritaskan keselamatan & keluarkan ruas jalan terverifikasi tertutup dari pertimbangan
    const viableRoutes = processedRoutes.filter(r => r.isViable && !r.isBlocked);
    const allRoutesBlocked = processedRoutes.length > 0 && viableRoutes.length === 0;

    let recommendedRouteId = processedRoutes[0]?.id || null;
    let detourNotice = null;
    let globalSelectionReason = '';

    if (!allRoutesBlocked && viableRoutes.length > 0) {
      // Aturan 3: Dari rute yang masih layak, pilih estimasi waktu tempuh terendah
      // Aturan 4: Jika waktu tempuh sama atau hampir sama (selisih <= 60 detik atau <= 5%), prioritaskan jarak yang lebih pendek
      viableRoutes.sort((a, b) => {
        const timeDiff = a.durationSeconds - b.durationSeconds;
        const timeDiffAbs = Math.abs(timeDiff);
        const minDuration = Math.min(a.durationSeconds, b.durationSeconds);
        const isTimeNearlyEqual = timeDiffAbs <= 60 || (minDuration > 0 && (timeDiffAbs / minDuration) <= 0.05);

        if (isTimeNearlyEqual) {
          // Prioritaskan jarak yang lebih pendek
          return a.distanceMeters - b.distanceMeters;
        }
        return timeDiff;
      });

      const bestRoute = viableRoutes[0];
      recommendedRouteId = bestRoute.id;

      if (processedRoutes[0].isBlocked) {
        const blocker = processedRoutes[0].blockedBy?.[0];
        detourNotice = `Laporan tentang ${blocker?.road_name || 'suatu ruas jalan'} berpotensi beririsan dengan rute. Verifikasi langsung dengan petugas.`;
        globalSelectionReason = `Jalur ini diperkirakan lebih cepat dari data peta, bukan dinilai aman untuk evakuasi.`;
      } else if (viableRoutes.length > 1) {
        const secondRoute = viableRoutes[1];
        const timeDiff = secondRoute.durationSeconds - bestRoute.durationSeconds;
        const timeDiffAbs = Math.abs(timeDiff);
        const minDuration = Math.min(bestRoute.durationSeconds, secondRoute.durationSeconds);
        const isTimeNearlyEqual = timeDiffAbs <= 60 || (minDuration > 0 && (timeDiffAbs / minDuration) <= 0.05);

        if (isTimeNearlyEqual && bestRoute.distanceMeters < secondRoute.distanceMeters) {
          globalSelectionReason = `Jarak lebih pendek pada data peta (${bestRoute.distanceFormatted}); kondisi lapangan tidak diverifikasi.`;
        } else {
          globalSelectionReason = `Perkiraan waktu peta tercepat (${bestRoute.durationFormatted}); kondisi lapangan tidak diverifikasi.`;
        }
      } else {
        globalSelectionReason = `Perkiraan rute pada data peta (${bestRoute.durationFormatted}, ${bestRoute.distanceFormatted}); bukan penilaian aman untuk evakuasi.`;
      }
    } else if (allRoutesBlocked) {
      globalSelectionReason = 'Laporan bahaya beririsan dengan rute; kondisi harus diverifikasi langsung dengan petugas.';
    }

    processedRoutes = processedRoutes.map(r => {
      const isRec = r.id === recommendedRouteId && !r.isBlocked;
      let reason = '';
      if (isRec) {
        reason = globalSelectionReason;
      } else if (r.isBlocked) {
        const blocker = r.blockedBy?.[0];
        reason = `Laporan bahaya beririsan dengan rute (${blocker?.road_name || 'lokasi'}); verifikasi dengan petugas.`;
      } else {
        reason = `Perkiraan jalan pada data peta (${r.durationFormatted}, ${r.distanceFormatted}); kondisi tidak diverifikasi.`;
      }

      return {
        ...r,
        isRecommended: isRec,
        selectionReason: reason
      };
    });

    return NextResponse.json({
      success: true,
      data_status: 'demo',
      source: routingSource,
      routingEngine: 'Configured road routing engine',
      timestamp: new Date().toISOString(),
      disclaimer: 'Rute hanya mengikuti data peta dan tidak memverifikasi tujuan, kondisi jalan, atau bahaya lapangan. Bukan rekomendasi evakuasi; ikuti arahan petugas dan kanal resmi. Koordinat dikirim hanya ke routing engine yang diaktifkan eksplisit oleh operator.',
      data: {
        routes: processedRoutes,
        recommendedRouteId,
        allRoutesBlocked,
        detourNotice,
        activeHazardsCount: activeHazards.length,
        hazardsDetected: activeHazards
      }
    });

  } catch (error) {
    console.error('API /api/map/routing error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses rute dari layanan jalan yang dikonfigurasi.' },
      { status: 500 }
    );
  }
}
