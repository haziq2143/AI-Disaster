async function requestJson(url, options) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Permintaan gagal (${response.status}).`);
  return result;
}

export const api = {
  requestAssessment: payload => requestJson('/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),

  getSmartRoutes: async (startLat, startLng, endLat, endLng, mode = 'driving') => {
    const query = new URLSearchParams({
      startLat: String(startLat),
      startLng: String(startLng),
      endLat: String(endLat),
      endLng: String(endLng),
      mode
    });
    const result = await requestJson(`/api/map/routing?${query}`);
    if (!result.success || !result.data) {
      throw new Error('Rute tidak dapat dihitung. Periksa koneksi lalu coba lagi.');
    }
    return result.data;
  },

  getRoadHazards: async () => {
    const result = await requestJson('/api/map/road-hazards');
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Status bahaya jalan tidak dapat dimuat.');
    }
    return result.data;
  },

  toggleRoadHazard: async (id, active) => {
    const result = await requestJson('/api/map/road-hazards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active })
    });
    if (!result.success) {
      throw new Error('Status bahaya jalan gagal diperbarui.');
    }
    return result;
  },

  getMapMarkers: async (lat = null, lng = null) => {
    const query = lat !== null && lng !== null
      ? `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
      : '';
    const result = await requestJson(`/api/map/markers${query}`);
    if (!result.success || !result.data) {
      throw new Error('Data peta tidak dapat dimuat. Periksa koneksi lalu coba lagi.');
    }
    return result;
  },

  submitEmergencyReport: async reportPayload => {
    const result = await requestJson('/api/map/emergency-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });
    if (!result.success || !result.data) {
      throw new Error('Laporan belum berhasil dicatat. Periksa koneksi lalu coba lagi.');
    }
    return result;
  }
};
