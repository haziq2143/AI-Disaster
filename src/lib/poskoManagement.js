const editableFields = new Set(['name', 'address', 'lat', 'lng', 'contact', 'operational_status', 'verification_status', 'current_occupancy', 'max_capacity']);

export function normalizePosko(posko) {
  const verificationStatus = posko.verification_status === 'sar_checked' ? 'sar_checked' : 'pending';
  const lastCheckedAt = verificationStatus === 'sar_checked'
    ? posko.last_checked_at || null
    : null;
  const lastCheckedBy = verificationStatus === 'sar_checked'
    ? posko.last_checked_by || null
    : null;

  return {
    ...posko,
    operational_status: ['open', 'closed'].includes(posko.operational_status)
      ? posko.operational_status
      : 'unknown',
    current_occupancy: typeof posko.current_occupancy === 'number' ? posko.current_occupancy : 0,
    max_capacity: typeof posko.max_capacity === 'number' && posko.max_capacity > 0 ? posko.max_capacity : 100,
    verification_status: verificationStatus,
    last_checked_at: lastCheckedAt,
    last_checked_by: lastCheckedBy,
    verified_at: lastCheckedAt,
    verified_by: lastCheckedBy ? `Dicek oleh Tim SAR: ${lastCheckedBy}` : null
  };
}

export function isRouteEligiblePosko(posko) {
  return posko?.operational_status === 'open' && posko?.verification_status === 'sar_checked';
}

export function validatePoskoUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { updates: null, error: 'Data posko tidak valid.' };
  }

  const keys = Object.keys(body);
  if (!keys.length || keys.some(key => !editableFields.has(key))) {
    return { updates: null, error: 'Data posko tidak valid.' };
  }

  const updates = {};
  if (Object.hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 120) {
      return { updates: null, error: 'Nama posko harus 2 sampai 120 karakter.' };
    }
    updates.name = body.name.trim();
  }
  if (Object.hasOwn(body, 'address')) {
    if (typeof body.address !== 'string' || body.address.trim().length < 2 || body.address.length > 200) {
      return { updates: null, error: 'Alamat posko harus 2 sampai 200 karakter.' };
    }
    updates.address = body.address.trim();
  }
  if (Object.hasOwn(body, 'lat')) {
    if (typeof body.lat !== 'number' || !Number.isFinite(body.lat) || body.lat < -90 || body.lat > 90) {
      return { updates: null, error: 'Latitude posko tidak valid.' };
    }
    updates.lat = body.lat;
  }
  if (Object.hasOwn(body, 'lng')) {
    if (typeof body.lng !== 'number' || !Number.isFinite(body.lng) || body.lng < -180 || body.lng > 180) {
      return { updates: null, error: 'Longitude posko tidak valid.' };
    }
    updates.lng = body.lng;
  }
  if (Object.hasOwn(body, 'contact')) {
    if (typeof body.contact !== 'string' || body.contact.length > 100) {
      return { updates: null, error: 'Kontak posko tidak valid.' };
    }
    updates.contact = body.contact.trim() || 'Belum diinformasikan';
  }
  if (Object.hasOwn(body, 'operational_status')) {
    if (!['unknown', 'open', 'closed'].includes(body.operational_status)) {
      return { updates: null, error: 'Status operasional posko tidak valid.' };
    }
    updates.operational_status = body.operational_status;
  }
  if (Object.hasOwn(body, 'verification_status')) {
    if (!['pending', 'sar_checked'].includes(body.verification_status)) {
      return { updates: null, error: 'Status pengecekan posko tidak valid.' };
    }
    updates.verification_status = body.verification_status;
  }
  if (Object.hasOwn(body, 'current_occupancy')) {
    if (typeof body.current_occupancy !== 'number' || !Number.isFinite(body.current_occupancy) || body.current_occupancy < 0) {
      return { updates: null, error: 'Jumlah pengungsi saat ini tidak valid.' };
    }
    updates.current_occupancy = Math.round(body.current_occupancy);
  }
  if (Object.hasOwn(body, 'max_capacity')) {
    if (typeof body.max_capacity !== 'number' || !Number.isFinite(body.max_capacity) || body.max_capacity <= 0) {
      return { updates: null, error: 'Kapasitas maksimal posko tidak valid.' };
    }
    updates.max_capacity = Math.round(body.max_capacity);
  }

  return { updates, error: null };
}

export function applyPoskoUpdate(posko, updates, actor, now = new Date()) {
  const current = normalizePosko(posko);
  const detailsChanged = ['name', 'address', 'lat', 'lng', 'contact']
    .some(field => Object.hasOwn(updates, field) && updates[field] !== current[field]);
  const reopened = current.operational_status !== 'open' && updates.operational_status === 'open';
  const requiresRecheck = detailsChanged || reopened;
  const updated = {
    ...current,
    ...updates,
    updated_at: now.toISOString()
  };

  if (requiresRecheck) {
    updated.verification_status = 'pending';
  }

  if (updated.verification_status === 'sar_checked' && !requiresRecheck) {
    updated.last_checked_at = now.toISOString();
    updated.last_checked_by = actor;
  } else if (requiresRecheck || updated.verification_status === 'pending') {
    updated.last_checked_at = null;
    updated.last_checked_by = null;
  }

  updated.status = updated.verification_status === 'sar_checked' ? 'sar_checked' : 'unverified';
  updated.verified_at = updated.last_checked_at;
  updated.verified_by = updated.last_checked_by
    ? `Dicek oleh Tim SAR: ${updated.last_checked_by}`
    : null;

  return updated;
}
