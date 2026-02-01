// Simple Service Worker to allow PWA installation without aggressive caching during debug
const CACHE_NAME = 'al-quran-v2.2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch to avoid "Blank Screen" due to stale/broken cached JS files
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});