const CACHE_NAME = 'al-quran-v2.5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first policy to prevent stale/broken code from being served by the cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});