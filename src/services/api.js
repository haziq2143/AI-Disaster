const getApiBase = () => {
  return '';
};

async function fetchWithFallback(urlPath, options = {}) {
  // 1. Try relative URL (Next.js App Router Route Handler)
  try {
    const res = await fetch(urlPath, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Relative request failed, try Express port 5000
  }

  // 2. Try Express server on port 5000
  try {
    const res = await fetch(`http://localhost:5000${urlPath}`, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Both failed
  }

  return null;
}

export const api = {
  // Health check
  checkHealth: async () => {
    return (await fetchWithFallback('/api/health')) || { status: 'offline' };
  },

  // AI Situation Assessment
  requestAssessment: async (payload) => {
    return await fetchWithFallback('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // Family Safety
  getFamily: async () => {
    const res = await fetchWithFallback('/api/family');
    return res?.data || null;
  },

  addFamily: async (member) => {
    return await fetchWithFallback('/api/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
  },

  toggleFamilyStatus: async (id) => {
    return await fetchWithFallback(`/api/family/${id}/status`, { method: 'PATCH' });
  },

  deleteFamily: async (id) => {
    return await fetchWithFallback(`/api/family/${id}`, { method: 'DELETE' });
  },

  // Evacuation Points
  getEvacuationPoints: async () => {
    const res = await fetchWithFallback('/api/evacuation-points');
    return res?.data || null;
  },

  // Checklist
  getChecklist: async () => {
    const res = await fetchWithFallback('/api/checklist');
    return res?.data || null;
  },

  toggleChecklistItem: async (id) => {
    return await fetchWithFallback(`/api/checklist/${id}/toggle`, { method: 'PATCH' });
  },

  // Safe Confirmation
  confirmSafe: async (payload) => {
    return await fetchWithFallback('/api/confirm-safe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // --- Real Database Geolocation & Leaflet + OpenStreetMap API Endpoints ---
  // Get all markers (Posko, Warga, Laporan Darurat) with distance to user's real GPS
  getMapMarkers: async (lat = null, lng = null) => {
    const query = lat !== null && lng !== null ? `?lat=${lat}&lng=${lng}` : '';
    const res = await fetchWithFallback(`/api/map/markers${query}`);
    return res?.data || null;
  },

  // Save actual user GPS location and precision consent status to database
  syncUserLocation: async (locationPayload) => {
    return await fetchWithFallback('/api/map/user-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationPayload)
    });
  },

  // Submit actual emergency distress report
  submitEmergencyReport: async (reportPayload) => {
    return await fetchWithFallback('/api/map/emergency-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });
  },

  // Get single emergency report details
  getEmergencyReportDetail: async (id) => {
    const res = await fetchWithFallback(`/api/map/emergency-reports/${id}`);
    return res?.data || null;
  },

  // Legacy compatibility helpers
  getSafetyMapPins: async () => {
    const res = await fetchWithFallback('/api/safety-map/pins');
    return res?.data || null;
  },

  toggleEmergencyMapStatus: async (status) => {
    return await fetchWithFallback('/api/safety-map/toggle-emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  getNearbyCommunity: async (maxDistance = 1000) => {
    const res = await fetchWithFallback(`/api/safety-map/nearby?maxDistance=${maxDistance}`);
    return res?.data || null;
  },

  reportMapPin: async (pinId, reason) => {
    return await fetchWithFallback('/api/safety-map/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinId, reason })
    });
  }
};
