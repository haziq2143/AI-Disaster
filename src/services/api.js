const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Health check
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  },

  // AI Situation Assessment
  requestAssessment: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, falling back to client-side logic:', e);
      return null;
    }
  },

  // Family Safety
  getFamily: async () => {
    try {
      const res = await fetch(`${API_BASE}/family`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      return null;
    }
  },

  addFamily: async (member) => {
    try {
      const res = await fetch(`${API_BASE}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  toggleFamilyStatus: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/family/${id}/status`, { method: 'PATCH' });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  deleteFamily: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/family/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  // Evacuation Points
  getEvacuationPoints: async () => {
    try {
      const res = await fetch(`${API_BASE}/evacuation-points`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      return null;
    }
  },

  // Checklist
  getChecklist: async () => {
    try {
      const res = await fetch(`${API_BASE}/checklist`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      return null;
    }
  },

  toggleChecklistItem: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/checklist/${id}/toggle`, { method: 'PATCH' });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  // Safe Confirmation
  confirmSafe: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/confirm-safe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};
