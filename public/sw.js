const CACHE_NAME = 'ai-disaster-offline-v2';
const APP_URL = new URL('/', self.location.origin).href;
const OFFLINE_URL = new URL('/offline.html', self.location.origin).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(OFFLINE_URL);
    try {
      const response = await fetch(APP_URL, { cache: 'reload' });
      if (response.ok) await cache.put(APP_URL, response);
    } catch (error) {
      console.warn('Offline app shell was not available during install:', error);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.filter(name => name.startsWith('ai-disaster-offline-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'PREPARE_OFFLINE') return;
  const replyPort = event.ports[0];
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const urls = new Set([APP_URL, OFFLINE_URL, ...(event.data.urls || [])]);
    let cachedCount = 0;
    let failedCount = 0;

    await Promise.all([...urls].map(async url => {
      try {
        const parsedUrl = new URL(url, self.location.origin);
        if (parsedUrl.origin !== self.location.origin || parsedUrl.pathname.startsWith('/api/')) return;
        const response = await fetch(parsedUrl.href, { cache: 'reload' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await cache.put(parsedUrl.href, response);
        cachedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.warn('Unable to cache offline resource:', url, error);
      }
    }));

    replyPort?.postMessage({ type: 'OFFLINE_READY', cachedCount, failedCount });
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/api/map/markers') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = new Request(new URL('/api/map/markers', self.location.origin));
      try {
        const response = await fetch(request);
        if (response.ok) {
          const result = await response.clone().json().catch(() => null);
          const isSafeToCache = result?.success === true
            && result.data?.user_location === null
            && Array.isArray(result.data.laporan_darurat)
            && result.data.laporan_darurat.length === 0
            && !url.searchParams.has('lat')
            && !url.searchParams.has('lng');
          if (isSafeToCache) await cache.put(cacheKey, response.clone());
        }
        return response;
      } catch {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) return cachedResponse;
        return Response.json({ success: false, error: 'Offline: belum ada data peta tersimpan.' }, { status: 503 });
      }
    })());
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok && url.pathname === '/') await cache.put(APP_URL, response.clone());
        return response;
      } catch {
        return await cache.match(APP_URL) || await cache.match(OFFLINE_URL);
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) {
        event.waitUntil(fetch(request).then(response => {
          if (response.ok) return cache.put(request, response);
          return undefined;
        }).catch(() => undefined));
        return cached;
      }
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
