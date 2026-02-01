const CACHE_NAME = 'al-quran-v2.6';

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
  // Always prefer network for now to ensure the fix propogates correctly
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});