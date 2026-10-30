// Accurate Haversine Straight-Line Distance Calculation (Meters)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Calculate realistic road network distance considering actual street geometry & detour factor
// Reference: Pusat Kota Cilegon (-5.9860, 106.0520)
export function calculateRoadDistance(userLat, userLng, destLat, destLng, benchmarkRoadMeters, travelMode = 'driving') {
  const haversineDist = calculateDistance(userLat, userLng, destLat, destLng);
  
  const refLat = -5.9860;
  const refLng = 106.0520;
  const userOffsetFromRef = calculateDistance(userLat, userLng, refLat, refLng);
  
  // If user is near Cilegon center (within 5 km), adjust benchmark proportionally to GPS movement
  if (userOffsetFromRef < 5000 && benchmarkRoadMeters) {
    const refToDestStraight = calculateDistance(refLat, refLng, destLat, destLng);
    const ratio = refToDestStraight > 0 ? haversineDist / refToDestStraight : 1;
    return Math.round(benchmarkRoadMeters * ratio);
  }
  
  // Detour factor for real road networks (Indonesian cities and regional arterials)
  const detourFactor = travelMode === 'walking' ? 1.30 : (haversineDist > 15000 ? 1.25 : 1.40);
  return Math.round(haversineDist * detourFactor);
}

export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} meter`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Realistic travel time calibrated with real traffic & Google Maps benchmarks
// Google Maps benchmarks: 21.6 km Cilegon-Serang is ~38 min (motor) / ~40 min (mobil) / ~4.5h (jalan); 6.0 km is ~12 min (motor) / ~13 min (mobil) / 1j 14m (jalan)
export function formatTravelTime(meters, travelMode = 'driving') {
  if (travelMode === 'walking') {
    // Walking speed ~4.8 km/h = 80 meters/min
    const walkMin = Math.max(1, Math.round(meters / 80));
    if (walkMin < 60) return `~${walkMin} mnt jalan kaki`;
    const h = Math.floor(walkMin / 60);
    const m = walkMin % 60;
    return m > 0 ? `~${h}j ${m}m jalan kaki` : `~${h} jam jalan kaki`;
  }

  // Driving mode:
  // Motor speed on Pantura/urban roads ~34 km/h = ~565 meters/min (calibrated: 21.6 km => ~38 mnt)
  // Mobil speed ~31 km/h = ~520 meters/min (calibrated: 21.6 km => ~41 mnt)
  const motorMin = Math.max(1, Math.round(meters / 565));
  const driveMin = Math.max(1, Math.round(meters / 520));
  const walkMin = Math.max(1, Math.round(meters / 80));

  if (motorMin < 60) {
    const walkStr = walkMin < 60 ? `${walkMin} mnt` : `${(walkMin / 60).toFixed(1)}j`;
    return `~${motorMin} mnt motor · ${driveMin} mnt mobil (${walkStr} jalan)`;
  }
  const h = Math.floor(motorMin / 60);
  const m = motorMin % 60;
  return m > 0 ? `~${h}j ${m}m berkendara` : `~${h} jam berkendara`;
}

export function formatWalkTime(meters) {
  return formatTravelTime(meters, 'driving');
}
