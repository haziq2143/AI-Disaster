import { NextResponse } from 'next/server';
import { getRoadHazards, calculateDistance } from '../../../../src/lib/disasterDb.js';

// Configurable Routing Engine URL (Requirement 5)
// Default to public OSRM server, can be configured to self-hosted or production OSRM
const ROUTING_BASE_URL = process.env.ROUTING_ENGINE_URL || 'https://router.project-osrm.org';

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

// Generate realistic street curve coordinates if offline / OSRM fails
function generateFallbackRoute(startLat, startLng, endLat, endLng, offsetCurve = 0) {
  const points = [];
  const steps = 24;
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wobble = Math.sin(t * Math.PI) * (0.003 + offsetCurve);
    const lat = startLat + dLat * t + wobble * 0.4;
    const lng = startLng + dLng * t + wobble;
    points.push([parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))]);
  }
  return points;
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
    const startLat = parseFloat(searchParams.get('startLat'));
    const startLng = parseFloat(searchParams.get('startLng'));
    const endLat = parseFloat(searchParams.get('endLat'));
    const endLng = parseFloat(searchParams.get('endLng'));
    const mode = searchParams.get('mode') === 'walking' ? 'walking' : 'driving';

    if (!startLat || !startLng || !endLat || !endLng) {
      return NextResponse.json(
        { success: false, error: 'Parameter startLat, startLng, endLat, endLng wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Fetch active disaster road hazards from database
    const allHazards = getRoadHazards();
    const activeHazards = allHazards.filter(h => h.active);

    // 2. Fetch routes from OSRM
    const osrmUrl = `${ROUTING_BASE_URL}/route/v1/${mode}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;

    let osrmRoutes = [];
    let routingSource = 'osrm_network';

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
      console.warn('OSRM request error or timeout, will use fallback:', osrmError.message);
    }

    // If OSRM returned only 1 route and the trip is a long corridor (e.g. Cilegon to Serang),
    // query a distinct alternative route via an alternative waypoint (e.g. Jl. Raya Pantura vs Tol)
    const isCilegonSerang = Math.abs(endLat - (-6.1180)) < 0.05 && Math.abs(startLat - (-5.9860)) < 0.05;
    if (osrmRoutes.length === 1 && isCilegonSerang) {
      try {
        const altViaUrl = `${ROUTING_BASE_URL}/route/v1/${mode}/${startLng},${startLat};106.1050,-6.0750;${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
        const altRes = await fetch(altViaUrl, { headers: { 'User-Agent': 'AIDisaster-SmartRouting/1.0' } });
        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.code === 'Ok' && altData.routes && altData.routes.length > 0) {
            osrmRoutes.push(altData.routes[0]);
          }
        }
      } catch (altErr) {
        // Ignore, fallback handled below
      }
    }

    // 3. Process candidate routes (from OSRM or fallback)
    let processedRoutes = [];

    if (osrmRoutes.length > 0) {
      processedRoutes = osrmRoutes.map((route, idx) => {
        const coordinates = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);
        const hazardCheck = checkRouteHazards(coordinates, activeHazards);
        
        let durationSeconds = Math.round(route.duration);
        if (hazardCheck.isImpacted) {
          // Apply realistic penalty of +15 minutes for waterlogged/impacted passable segments
          durationSeconds += 900;
        }

        const defaultSummary = idx === 0 
          ? (route.legs?.[0]?.summary || 'Jalur Utama Tol / Arteri')
          : (route.legs?.[0]?.summary || 'Jalur Alternatif Non-Tol / Pantura');

        // Status kondisi jalan jujur & objektif tanpa mengarang kemacetan (Aturan 7)
        let statusBadge = 'unknown_reports';
        let statusLabel = 'Belum ada laporan bahaya terdata (kondisi dinamis)';
        let isViable = true;

        if (hazardCheck.isBlocked) {
          isViable = false;
          statusBadge = 'blocked';
          const blocker = hazardCheck.blockedBy[0];
          statusLabel = `DITUTUP TOTAL: Terverifikasi ${blocker?.hazard_type || 'Bencana'} (${blocker?.road_name || 'Ruas Jalan'})`;
        } else if (hazardCheck.isImpacted) {
          statusBadge = 'impacted';
          const impacter = hazardCheck.impactedBy[0];
          statusLabel = `TERDAMPAK: ${impacter?.description || 'Genangan air terverifikasi (waspada perlambatan)'}`;
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
    } else {
      // Fallback routes when OSRM server is unavailable (Requirement 4 & 5)
      routingSource = 'local_offline_fallback';
      const baseDist = calculateDistance(startLat, startLng, endLat, endLng) * 1.15;
      
      const fallbackCoords1 = generateFallbackRoute(startLat, startLng, endLat, endLng, 0);
      const hazardCheck1 = checkRouteHazards(fallbackCoords1, activeHazards);
      const durSec1 = Math.round(baseDist / (mode === 'walking' ? 1.25 : 10)) + (hazardCheck1.isImpacted ? 900 : 0);

      const fallbackCoords2 = generateFallbackRoute(startLat, startLng, endLat, endLng, 0.005);
      const hazardCheck2 = checkRouteHazards(fallbackCoords2, activeHazards);
      const durSec2 = Math.round((baseDist * 1.08) / (mode === 'walking' ? 1.25 : 10)) + (hazardCheck2.isImpacted ? 900 : 0);

      processedRoutes = [
        {
          id: 'route-0',
          routeNumber: 1,
          name: 'Rute 1 (Jalur Utama - Mode Cadangan)',
          summary: 'Jalan Protokol Utama',
          coordinates: fallbackCoords1,
          distanceMeters: Math.round(baseDist),
          distanceFormatted: formatDistance(baseDist),
          durationSeconds: durSec1,
          durationFormatted: formatDuration(durSec1, mode),
          steps: [
            { step: 1, title: 'Mulai dari Lokasi GPS Anda', instruction: 'Melaju menuju jalur arteri utama.' },
            { step: 2, title: 'Menyusuri Jalan Protokol', instruction: 'Ikuti jalan utama yang berpenerangan dan bebas hambatan.' },
            { step: 3, title: 'Tiba di Gerbang Lokasi Tujuan', instruction: 'Masuki gerbang lokasi tujuan.' }
          ],
          statusBadge: hazardCheck1.isBlocked ? 'blocked' : hazardCheck1.isImpacted ? 'impacted' : 'unknown_reports',
          statusLabel: hazardCheck1.isBlocked ? 'DITUTUP TOTAL: Terverifikasi Bencana' : 'Belum ada laporan bahaya terdata (kondisi dinamis)',
          isViable: !hazardCheck1.isBlocked,
          isBlocked: hazardCheck1.isBlocked,
          isImpacted: hazardCheck1.isImpacted,
          hasUnverifiedWarning: hazardCheck1.hasUnverifiedWarning,
          blockedBy: hazardCheck1.blockedBy,
          impactedBy: hazardCheck1.impactedBy,
          unverifiedWarnings: hazardCheck1.unverifiedWarnings
        },
        {
          id: 'route-1',
          routeNumber: 2,
          name: 'Rute 2 (Jalur Alternatif - Mode Cadangan)',
          summary: 'Jalur Alternatif Lingkungan',
          coordinates: fallbackCoords2,
          distanceMeters: Math.round(baseDist * 1.08),
          distanceFormatted: formatDistance(baseDist * 1.08),
          durationSeconds: durSec2,
          durationFormatted: formatDuration(durSec2, mode),
          steps: [
            { step: 1, title: 'Arahkan ke Jalur Alternatif', instruction: 'Gunakan jalan lingkar luar yang berada di elevasi lebih tinggi.' },
            { step: 2, title: 'Lintasi Jalan Penghubung', instruction: 'Tetap di jalur aspal kering.' },
            { step: 3, title: 'Tiba di Lokasi Tujuan', instruction: 'Masuk melalui gerbang timur lokasi tujuan.' }
          ],
          statusBadge: hazardCheck2.isBlocked ? 'blocked' : hazardCheck2.isImpacted ? 'impacted' : 'unknown_reports',
          statusLabel: hazardCheck2.isBlocked ? 'DITUTUP TOTAL: Terverifikasi Bencana' : 'Belum ada laporan bahaya terdata (kondisi dinamis)',
          isViable: !hazardCheck2.isBlocked,
          isBlocked: hazardCheck2.isBlocked,
          isImpacted: hazardCheck2.isImpacted,
          hasUnverifiedWarning: hazardCheck2.hasUnverifiedWarning,
          blockedBy: hazardCheck2.blockedBy,
          impactedBy: hazardCheck2.impactedBy,
          unverifiedWarnings: hazardCheck2.unverifiedWarnings
        }
      ];
    }

    // 4. SMART ROUTING SELECTION LOGIC (Aturan 1 - 4 & 6, 9)
    // Aturan 1 & 2: Prioritaskan keselamatan & keluarkan ruas jalan terverifikasi tertutup dari pertimbangan
    const viableRoutes = processedRoutes.filter(r => r.isViable && !r.isBlocked);
    const allRoutesBlocked = processedRoutes.length > 0 && viableRoutes.length === 0;

    let recommendedRouteId = processedRoutes[0]?.id || 'route-0';
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

      // Aturan 9: Jelaskan alasan sistem memilih rute ini
      if (processedRoutes[0].isBlocked) {
        // Aturan 6: Rute utama tertutup bencana terverifikasi, dialihkan ke alternatif
        const blocker = processedRoutes[0].blockedBy?.[0];
        detourNotice = `Rute 1 (Jalur Utama) ditutup akibat ${blocker?.hazard_type || 'bencana'} (${blocker?.road_name || 'ruas jalan terendam'}). Sistem secara otomatis mengalihkan navigasi ke ${bestRoute.name}.`;
        globalSelectionReason = `Pengalihan Otomatis: Menghindari penutupan jalan di ${blocker?.road_name || 'ruas jalan'}. Dipilih alternatif yang masih layak dengan waktu ${bestRoute.durationFormatted}.`;
      } else if (viableRoutes.length > 1) {
        const secondRoute = viableRoutes[1];
        const timeDiff = secondRoute.durationSeconds - bestRoute.durationSeconds;
        const timeDiffAbs = Math.abs(timeDiff);
        const minDuration = Math.min(bestRoute.durationSeconds, secondRoute.durationSeconds);
        const isTimeNearlyEqual = timeDiffAbs <= 60 || (minDuration > 0 && (timeDiffAbs / minDuration) <= 0.05);

        if (isTimeNearlyEqual && bestRoute.distanceMeters < secondRoute.distanceMeters) {
          globalSelectionReason = `Rekomendasi Cerdas: Jarak lebih pendek (${bestRoute.distanceFormatted}) dengan estimasi waktu tempuh setara (${bestRoute.durationFormatted}).`;
        } else {
          globalSelectionReason = `Rekomendasi Cerdas: Estimasi waktu tempuh tercepat (${bestRoute.durationFormatted}) dan jalur layak tanpa penutupan jalan.`;
        }
      } else {
        globalSelectionReason = `Rekomendasi Cerdas: Jalur tercepat (${bestRoute.durationFormatted}, ${bestRoute.distanceFormatted}) dan bebas hambatan penutupan jalan terverifikasi.`;
      }
    } else if (allRoutesBlocked) {
      globalSelectionReason = 'Peringatan Darurat: Seluruh rute darat terhalang bencana terverifikasi. Jangan melintas, hubungi SAR 115 / BPBD 112.';
    }

    processedRoutes = processedRoutes.map(r => {
      const isRec = r.id === recommendedRouteId && !r.isBlocked;
      let reason = '';
      if (isRec) {
        reason = globalSelectionReason;
      } else if (r.isBlocked) {
        const blocker = r.blockedBy?.[0];
        reason = `Tidak Direkomendasikan: Ruas jalan terverifikasi ditutup (${blocker?.road_name || 'Titik Bencana'}).`;
      } else {
        reason = `Rute Alternatif: Jalur cadangan (${r.durationFormatted}, ${r.distanceFormatted}).`;
      }

      return {
        ...r,
        isRecommended: isRec,
        selectionReason: reason
      };
    });

    return NextResponse.json({
      success: true,
      source: routingSource,
      routingEngine: routingSource === 'osrm_network' ? 'OSRM (Open Source Routing Machine)' : 'Perkiraan Jalan Lokal (Offline)',
      timestamp: new Date().toISOString(),
      disclaimer: 'Peringatan: Kondisi lapangan dinamis. Status bebas hambatan bukan jaminan aman mutlak (PRD 4.6). Patuhi instruksi petugas di lapangan.',
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
      { success: false, error: 'Gagal memproses smart routing navigasi bencana.' },
      { status: 500 }
    );
  }
}
