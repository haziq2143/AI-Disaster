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
