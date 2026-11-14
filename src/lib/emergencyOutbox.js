/**
 * Emergency SOS Outbox Queue & Offline Auto-Sync
 * Ensures no emergency distress signal is lost when mobile cellular signal (BTS) is down.
 */

const OUTBOX_KEY = 'ai_disaster_sos_outbox';

export function getSosOutbox() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Gagal membaca antrean SOS offline:', err);
    return [];
  }
}

export function saveSosOutbox(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Gagal menyimpan antrean SOS offline:', err);
  }
}

export function queueSosReport(payload) {
  const current = getSosOutbox();
  const queueItem = {
    id: `queued-sos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    payload,
    queuedAt: new Date().toISOString(),
    retryCount: 0
  };
  current.push(queueItem);
  saveSosOutbox(current);
  return queueItem;
}

export function removeSosFromOutbox(id) {
  const current = getSosOutbox();
  const updated = current.filter(item => item.id !== id);
  saveSosOutbox(updated);
}

export async function flushSosOutbox(onSuccessItem) {
  if (typeof window === 'undefined') return { sentCount: 0, pendingCount: 0 };
  if (!navigator.onLine) {
    return { sentCount: 0, pendingCount: getSosOutbox().length };
  }

  const outbox = getSosOutbox();
  if (outbox.length === 0) return { sentCount: 0, pendingCount: 0 };

  let sentCount = 0;
  for (const item of outbox) {
    try {
      const response = await fetch('/api/map/emergency-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        removeSosFromOutbox(item.id);
        sentCount++;
        if (typeof onSuccessItem === 'function') {
          onSuccessItem(resData.data, item);
        }
      } else {
        item.retryCount = (item.retryCount || 0) + 1;
      }
    } catch {
      item.retryCount = (item.retryCount || 0) + 1;
    }
  }

  return { sentCount, pendingCount: getSosOutbox().length };
}

export function initOfflineSosSync(onSyncSuccess) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    flushSosOutbox(onSyncSuccess);
  };

  window.addEventListener('online', handleOnline);
  // Cek setiap 15 detik jika jaringan pulih diam-diam tanpa event online
  const intervalId = setInterval(() => {
    if (navigator.onLine && getSosOutbox().length > 0) {
      flushSosOutbox(onSyncSuccess);
    }
  }, 15000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}
